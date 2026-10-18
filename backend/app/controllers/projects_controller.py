from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.controllers.api_utils import (
    commit_or_conflict,
    enum_from_name,
    enum_value,
    find_by_public_id,
    page_bounds,
    paginate,
)
from app.controllers.organization_controller import employee_summary_out
from app.core.deps import get_current_user, require_role
from app.db.base import ProjectStatus, Role
from app.db.session import get_db
from app.models import Employee, Project, ProjectMember, User
from app.schemas.api import (
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


def project_status_out(value: ProjectStatus) -> str:
    return "PLANNING" if value == ProjectStatus.planned else value.value.upper()


def project_out(
    project: Project,
    include_members: bool = False,
    employee_department_id: int | None = None,
    restrict_members_by_department: bool = False,
) -> dict:
    result = {
        "id": project.public_id,
        "name": project.name,
        "description": project.description or "",
        "start_date": project.start_date.isoformat() if project.start_date else "",
        "end_date": project.end_date.isoformat() if project.end_date else "",
        "status": project_status_out(project.status),
        "created_by": project.created_by_user.public_id if project.created_by_user else None,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
    }
    if include_members:
        result["members"] = [
            member_out(member)
            for member in project.members
            if not restrict_members_by_department
            or (
                employee_department_id is not None
                and member.employee.department_id == employee_department_id
            )
        ]
    return result


def member_out(member: ProjectMember) -> dict:
    return {
        "id": member.public_id,
        "project_id": member.project.public_id,
        "employee_id": member.employee.public_id,
        "project_role": member.project_role,
        "assigned_at": member.assigned_at.isoformat(),
        "employee": employee_summary_out(member.employee),
    }


def get_project(db: Session, project_id: UUID | str, include_members: bool = False) -> Project:
    query = select(Project)
    if include_members:
        query = query.options(
            joinedload(Project.members)
            .joinedload(ProjectMember.employee)
            .joinedload(Employee.user),
            joinedload(Project.members)
            .joinedload(ProjectMember.employee)
            .joinedload(Employee.department),
            joinedload(Project.members)
            .joinedload(ProjectMember.employee)
            .joinedload(Employee.designation),
        )
    project = db.scalar(query.where(Project.public_id == str(project_id)))
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


def ensure_project_management_access(db: Session, project: Project, user: User) -> None:
    if project.created_by == user.id:
        return
    if (
        user.role == Role.manager
        and user.employee is not None
        and user.employee.department_id is not None
    ):
        team_member = db.scalar(
            select(ProjectMember.id)
            .join(Employee, ProjectMember.employee_id == Employee.id)
            .where(
                ProjectMember.project_id == project.id,
                Employee.manager_id == user.employee.id,
                Employee.department_id == user.employee.department_id,
            )
            .limit(1)
        )
        if team_member is not None:
            return
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")


def ensure_project_read_access(db: Session, project: Project, user: User) -> None:
    if user.role == Role.hr:
        return
    if user.role == Role.manager:
        ensure_project_management_access(db, project, user)
        return
    if user.employee is not None and any(
        member.employee_id == user.employee.id for member in project.members
    ):
        return
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")


def ensure_employee_is_manager_team_member(employee: Employee, user: User) -> None:
    if user.employee is None or (
        employee.id == user.employee.id
        or employee.manager_id != user.employee.id
        or user.employee.department_id is None
        or employee.department_id != user.employee.department_id
    ):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Employee is not in your department team",
        )


@router.get("")
def list_projects(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Project)
    count_stmt = select(func.count(Project.id))
    if user.role == Role.manager:
        access_filter = Project.created_by == user.id
        if user.employee is not None and user.employee.department_id is not None:
            team_projects = (
                select(ProjectMember.project_id)
                .join(Employee, ProjectMember.employee_id == Employee.id)
                .where(
                    Employee.manager_id == user.employee.id,
                    Employee.department_id == user.employee.department_id,
                )
            )
            access_filter = or_(access_filter, Project.id.in_(team_projects))
        stmt = stmt.where(access_filter)
        count_stmt = count_stmt.where(access_filter)
    if search:
        criterion = Project.name.ilike(f"%{search.strip()}%")
        stmt, count_stmt = stmt.where(criterion), count_stmt.where(criterion)
    if status_filter:
        value = enum_from_name(ProjectStatus, status_filter, "status")
        stmt = stmt.where(Project.status == value)
        count_stmt = count_stmt.where(Project.status == value)
    offset, limit = page_bounds(page, page_size)
    projects = db.scalars(stmt.order_by(Project.id.desc()).offset(offset).limit(limit)).all()
    total = db.scalar(count_stmt) or 0
    return paginate([project_out(project) for project in projects], total, page, page_size)


@router.get("/my")
def my_projects(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.employee is None:
        return paginate([], 0, page, page_size)
    stmt = (
        select(Project)
        .join(ProjectMember)
        .where(ProjectMember.employee_id == user.employee.id)
    )
    count_stmt = (
        select(func.count(Project.id))
        .join(ProjectMember)
        .where(ProjectMember.employee_id == user.employee.id)
    )
    offset, limit = page_bounds(page, page_size)
    projects = db.scalars(stmt.order_by(Project.id.desc()).offset(offset).limit(limit)).unique().all()
    return paginate([project_out(project) for project in projects], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/{project_id}")
def get_project_by_id(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_project(db, project_id, include_members=True)
    ensure_project_read_access(db, project, user)
    department_id = (
        user.employee.department_id
        if user.role == Role.manager and user.employee is not None
        else None
    )
    return project_out(
        project,
        include_members=True,
        employee_department_id=department_id,
        restrict_members_by_department=user.role == Role.manager,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    if user.role == Role.manager and user.employee is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Manager account has no employee profile")
    if body.start_date and body.end_date and body.end_date < body.start_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "end_date must not be before start_date")
    project = Project(
        name=body.name.strip(),
        description=body.description,
        start_date=body.start_date,
        end_date=body.end_date,
        status=enum_from_name(ProjectStatus, body.status, "status"),
        created_by=user.id,
    )
    db.add(project)
    commit_or_conflict(db)
    return project_out(project)


@router.put("/{project_id}")
def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    project = get_project(db, project_id)
    ensure_project_management_access(db, project, user)
    fields = body.model_dump(exclude_unset=True)
    status_value = fields.pop("status", None)
    for key, value in fields.items():
        setattr(project, key, value.strip() if key == "name" and value else value)
    if status_value is not None:
        project.status = enum_from_name(ProjectStatus, status_value, "status")
    if project.start_date and project.end_date and project.end_date < project.start_date:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "end_date must not be before start_date")
    commit_or_conflict(db)
    return project_out(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    project = get_project(db, project_id)
    ensure_project_management_access(db, project, user)
    db.delete(project)
    commit_or_conflict(db)
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/members")
def get_project_members(
    project_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = get_project(db, project_id, include_members=True)
    ensure_project_read_access(db, project, user)
    return [
        member_out(member)
        for member in project.members
        if user.role != Role.manager
        or (
            user.employee is not None
            and user.employee.department_id is not None
            and member.employee.department_id == user.employee.department_id
        )
    ]


@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: UUID,
    body: ProjectMemberCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    project = get_project(db, project_id)
    ensure_project_management_access(db, project, user)
    employee = find_by_public_id(db, Employee, body.employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    ensure_employee_is_manager_team_member(employee, user)

    project_role = body.project_role.strip()
    if not project_role:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "project_role must not be empty",
        )
    member = ProjectMember(
        project_id=project.id,
        employee_id=employee.id,
        project_role=project_role,
    )
    db.add(member)
    commit_or_conflict(db)
    member = db.scalar(
        select(ProjectMember)
        .options(
            joinedload(ProjectMember.employee).joinedload(Employee.user),
            joinedload(ProjectMember.employee).joinedload(Employee.department),
            joinedload(ProjectMember.employee).joinedload(Employee.designation),
        )
        .where(ProjectMember.id == member.id)
    )
    return member_out(member)


@router.put("/{project_id}/members/{employee_id}")
def update_project_member(
    project_id: UUID,
    employee_id: UUID,
    body: ProjectMemberUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    project = get_project(db, project_id)
    ensure_project_management_access(db, project, user)
    employee = find_by_public_id(db, Employee, employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project member not found")
    ensure_employee_is_manager_team_member(employee, user)
    member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.employee_id == employee.id,
        )
    )
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project member not found")

    project_role = body.project_role.strip()
    if not project_role:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "project_role must not be empty",
        )
    member.project_role = project_role
    commit_or_conflict(db)
    member = db.scalar(
        select(ProjectMember)
        .options(
            joinedload(ProjectMember.employee).joinedload(Employee.user),
            joinedload(ProjectMember.employee).joinedload(Employee.department),
            joinedload(ProjectMember.employee).joinedload(Employee.designation),
        )
        .where(ProjectMember.id == member.id)
    )
    return member_out(member)


@router.delete("/{project_id}/members/{employee_id}")
def remove_project_member(
    project_id: UUID,
    employee_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    project = get_project(db, project_id)
    ensure_project_management_access(db, project, user)
    employee = find_by_public_id(db, Employee, employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project member not found")
    ensure_employee_is_manager_team_member(employee, user)
    member = db.scalar(select(ProjectMember).where(
        ProjectMember.project_id == project.id,
        ProjectMember.employee_id == employee.id,
    ))
    if member is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project member not found")

    db.delete(member)
    commit_or_conflict(db)
    return {"message": "Project member removed successfully"}
