from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.controllers.leave_controller import leave_out
from app.controllers.projects_controller import project_out, project_status_out
from app.core.deps import get_current_user, require_role
from app.db.base import EmployeeStatus, LeaveStatus, Role
from app.db.session import get_db
from app.models import Department, Employee, LeaveRequest, Project, ProjectMember, User
from app.services.leave_service import get_leave_balance

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


@router.get("/hr")
def hr_dashboard(db: Session = Depends(get_db), user: User = Depends(require_role(Role.hr))):
    total_employees = db.scalar(select(func.count(Employee.id))) or 0
    total_managers = db.scalar(
        select(func.count(Employee.id)).join(Employee.user).where(User.role == Role.manager)
    ) or 0
    active_employees = db.scalar(
        select(func.count(Employee.id)).where(Employee.status == EmployeeStatus.active)
    ) or 0
    total_departments = db.scalar(select(func.count(Department.id))) or 0
    pending_manager_leaves = db.scalar(
        select(func.count(LeaveRequest.id))
        .join(LeaveRequest.employee)
        .join(Employee.user)
        .where(LeaveRequest.status == LeaveStatus.pending, User.role == Role.manager)
    ) or 0
    rows = db.execute(
        select(Department.name, func.count(Employee.id))
        .outerjoin(Employee, Employee.department_id == Department.id)
        .group_by(Department.id, Department.name)
        .order_by(Department.name)
    )
    return {
        "total_employees": total_employees,
        "total_managers": total_managers,
        "active_employees": active_employees,
        "total_departments": total_departments,
        "pending_manager_leaves": pending_manager_leaves,
        "department_summary": [
            {"department_name": name, "employee_count": count} for name, count in rows
        ],
    }


@router.get("/manager")
def manager_dashboard(db: Session = Depends(get_db), user: User = Depends(require_role(Role.manager))):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    employee_id = user.employee.id
    team_ids = select(Employee.id).where(Employee.manager_id == employee_id)
    team_size = db.scalar(select(func.count(Employee.id)).where(Employee.manager_id == employee_id)) or 0
    pending_team_leaves = db.scalar(
        select(func.count(LeaveRequest.id))
        .where(
            LeaveRequest.employee_id.in_(team_ids),
            LeaveRequest.status == LeaveStatus.pending,
        )
    ) or 0
    rows = db.execute(
        select(Project.id, Project.name, Project.status, func.count(ProjectMember.id))
        .join(ProjectMember)
        .join(Employee, ProjectMember.employee_id == Employee.id)
        .where(Employee.manager_id == employee_id)
        .group_by(Project.id, Project.name, Project.status)
        .order_by(Project.name)
    )
    return {
        "team_size": team_size,
        "pending_team_leaves": pending_team_leaves,
        "team_projects": [
            {
                "id": project_id,
                "name": name,
                "status": project_status_out(project_status),
                "member_count": member_count,
            }
            for project_id, name, project_status, member_count in rows
        ],
    }


@router.get("/employee")
def employee_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.employee)),
):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    employee_id = user.employee.id
    balance = get_leave_balance(db, employee_id, date.today().year)
    recent_requests = db.scalars(
        select(LeaveRequest)
        .options(
            joinedload(LeaveRequest.leave_type),
            joinedload(LeaveRequest.employee).joinedload(Employee.user),
            joinedload(LeaveRequest.employee).joinedload(Employee.department),
            joinedload(LeaveRequest.employee).joinedload(Employee.designation),
        )
        .where(LeaveRequest.employee_id == employee_id)
        .order_by(LeaveRequest.created_at.desc())
        .limit(5)
    ).unique().all()
    projects = db.scalars(
        select(Project)
        .join(ProjectMember)
        .where(ProjectMember.employee_id == employee_id)
        .order_by(Project.id.desc())
    ).unique().all()
    return {
        "leave_balance": balance,
        "recent_leave_requests": [leave_out(item) for item in recent_requests],
        "assigned_projects": [project_out(project) for project in projects],
    }
