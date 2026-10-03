from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.db.base import EmployeeStatus, Gender, Role
from app.db.session import get_db
from app.models import (
    Department,
    Designation,
    Employee,
    LeaveRequest,
    OldEmployee,
    OldEmployeeProject,
    User,
)
from app.schemas.api import (
    DepartmentCreate,
    DepartmentUpdate,
    DesignationCreate,
    DesignationUpdate,
    EmployeeCreate,
    EmployeeUpdate,
    ProfileUpdate,
)
from app.services.employee_service import archive_employee
from app.controllers.api_utils import (
    commit_or_conflict,
    enum_from_name,
    enum_value,
    page_bounds,
    paginate,
)

router = APIRouter(tags=["Employees", "Organization", "Former employees"])


def department_out(department: Department | None) -> dict | None:
    if department is None:
        return None
    return {
        "id": department.id,
        "name": department.name,
        "description": department.description or "",
        "created_at": department.created_at.isoformat(),
        "updated_at": department.updated_at.isoformat(),
    }


def designation_out(designation: Designation | None) -> dict | None:
    if designation is None:
        return None
    return {
        "id": designation.id,
        "name": designation.name,
        "description": designation.description or "",
        "department_id": designation.department_id,
        "department": department_out(designation.department),
        "created_at": designation.created_at.isoformat(),
        "updated_at": designation.updated_at.isoformat(),
    }


def employee_summary_out(employee: Employee | None) -> dict | None:
    if employee is None:
        return None
    return {
        "id": employee.id,
        "employee_code": employee.employee_code,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.user.email,
        "department": department_out(employee.department),
        "designation": designation_out(employee.designation),
    }


def employee_out(employee: Employee) -> dict:
    return {
        "id": employee.id,
        "employee_code": employee.employee_code,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.user.email,
        "phone": employee.phone or "",
        "date_of_birth": employee.date_of_birth.isoformat() if employee.date_of_birth else "",
        "gender": enum_value(employee.gender).upper() if employee.gender else "OTHER",
        "address": employee.address or "",
        "skills": ", ".join(employee.skills or []) if isinstance(employee.skills, list) else (employee.skills or ""),
        "emergency_contact": " ".join(filter(None, (
            employee.emergency_contact_name, employee.emergency_contact_phone
        ))),
        "joining_date": employee.date_of_joining.isoformat(),
        "department_id": employee.department_id,
        "designation_id": employee.designation_id,
        "manager_id": employee.manager_id,
        "status": enum_value(employee.status).upper(),
        "user_id": employee.user_id,
        "department": department_out(employee.department),
        "designation": designation_out(employee.designation),
        "manager": employee_summary_out(employee.manager),
        "created_at": employee.created_at.isoformat(),
        "updated_at": employee.updated_at.isoformat(),
    }


def _apply_employee_fields(employee: Employee, fields: dict, actor_id: int) -> None:
    if "gender" in fields:
        fields["gender"] = enum_from_name(Gender, fields["gender"], "gender")
    if "status" in fields and fields["status"] is not None:
        fields["status"] = enum_from_name(EmployeeStatus, fields["status"], "status")
    if "skills" in fields and fields["skills"] is not None:
        fields["skills"] = [skill.strip() for skill in fields["skills"].split(",") if skill.strip()]
    if "emergency_contact" in fields:
        fields["emergency_contact_name"] = fields.pop("emergency_contact")
    if "joining_date" in fields:
        fields["date_of_joining"] = fields.pop("joining_date")
    for key, value in fields.items():
        setattr(employee, key, value)
    employee.updated_by = actor_id


def _employee_query():
    return select(Employee).options(
        joinedload(Employee.user),
        joinedload(Employee.department),
        joinedload(Employee.designation).joinedload(Designation.department),
        joinedload(Employee.manager).joinedload(Employee.user),
        joinedload(Employee.manager).joinedload(Employee.department),
        joinedload(Employee.manager).joinedload(Employee.designation),
    )


def _get_employee(db: Session, employee_id: int) -> Employee:
    employee = db.scalar(_employee_query().where(Employee.id == employee_id))
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    return employee


def _validate_manager(db: Session, manager_id: int | None) -> None:
    if manager_id is not None and db.scalar(
        select(Employee.id)
        .join(Employee.user)
        .where(Employee.id == manager_id, User.role == Role.manager)
    ) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "manager_id must identify a manager")


@router.get("/employees")
def list_employees(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    department_id: int | None = None,
    designation_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    stmt = _employee_query()
    count_stmt = select(func.count(Employee.id))
    if search:
        pattern = f"%{search.strip()}%"
        criterion = or_(
            Employee.first_name.ilike(pattern),
            Employee.last_name.ilike(pattern),
            Employee.employee_code.ilike(pattern),
            User.email.ilike(pattern),
        )
        stmt = stmt.join(Employee.user).where(criterion)
        count_stmt = count_stmt.join(Employee.user).where(criterion)
    if status_filter:
        value = enum_from_name(EmployeeStatus, status_filter, "status")
        stmt = stmt.where(Employee.status == value)
        count_stmt = count_stmt.where(Employee.status == value)
    if department_id is not None:
        stmt = stmt.where(Employee.department_id == department_id)
        count_stmt = count_stmt.where(Employee.department_id == department_id)
    if designation_id is not None:
        stmt = stmt.where(Employee.designation_id == designation_id)
        count_stmt = count_stmt.where(Employee.designation_id == designation_id)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Employee.id).offset(offset).limit(limit)).unique().all()
    return paginate([employee_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/employees/managers")
def list_managers(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    stmt = _employee_query().join(Employee.user).where(User.role == Role.manager)
    count_stmt = select(func.count(Employee.id)).join(Employee.user).where(User.role == Role.manager)
    if search:
        pattern = f"%{search.strip()}%"
        criterion = or_(Employee.first_name.ilike(pattern), Employee.last_name.ilike(pattern),
                        Employee.employee_code.ilike(pattern), User.email.ilike(pattern))
        stmt = stmt.where(criterion)
        count_stmt = count_stmt.where(criterion)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Employee.id).offset(offset).limit(limit)).unique().all()
    return paginate([employee_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/employees/me")
def get_my_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    return employee_out(_get_employee(db, user.employee.id))


@router.put("/employees/me")
def update_my_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    employee = _get_employee(db, user.employee.id)
    _apply_employee_fields(employee, body.model_dump(exclude_unset=True), user.id)
    commit_or_conflict(db)
    return employee_out(_get_employee(db, employee.id))


@router.get("/employees/my-team")
def get_my_team(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.manager)),
):
    if user.employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No employee profile is linked to this account")
    stmt = _employee_query().where(Employee.manager_id == user.employee.id)
    count_stmt = select(func.count(Employee.id)).where(Employee.manager_id == user.employee.id)
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.join(Employee.user).where(or_(
            Employee.first_name.ilike(pattern), Employee.last_name.ilike(pattern),
            Employee.employee_code.ilike(pattern), User.email.ilike(pattern),
        ))
        count_stmt = count_stmt.join(Employee.user).where(or_(
            Employee.first_name.ilike(pattern), Employee.last_name.ilike(pattern),
            Employee.employee_code.ilike(pattern), User.email.ilike(pattern),
        ))
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Employee.id).offset(offset).limit(limit)).unique().all()
    return paginate([employee_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/employees/{employee_id}")
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    employee = _get_employee(db, employee_id)
    if user.role != Role.hr and employee.user_id != user.id and employee.manager_id != getattr(user.employee, "id", None):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")
    return employee_out(employee)


@router.post("/employees", status_code=status.HTTP_201_CREATED)
def create_employee(
    body: EmployeeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    department = db.get(Department, body.department_id) if body.department_id else None
    designation = db.get(Designation, body.designation_id) if body.designation_id else None
    if body.department_id and department is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Department not found")
    if body.designation_id and (designation is None or designation.department_id != body.department_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Designation must belong to the selected department")
    _validate_manager(db, body.manager_id)
    role = enum_from_name(Role, body.role, "role")
    password = body.password or "Welcome@123"
    account = User(
        email=str(body.email).lower(),
        password_hash=hash_password(password),
        role=role,
        is_first_login=True,
    )
    db.add(account)
    db.flush()
    employee = Employee(
        user_id=account.id,
        employee_code=body.employee_code.strip(),
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        phone=body.phone,
        date_of_birth=body.date_of_birth,
        gender=enum_from_name(Gender, body.gender, "gender") if body.gender else None,
        address=body.address,
        skills=[item.strip() for item in body.skills.split(",") if item.strip()] if body.skills else [],
        emergency_contact_name=body.emergency_contact,
        date_of_joining=body.joining_date,
        department_id=body.department_id,
        designation_id=body.designation_id,
        manager_id=body.manager_id,
        status=enum_from_name(EmployeeStatus, body.status, "status"),
        created_by=user.id,
    )
    db.add(employee)
    commit_or_conflict(db)
    return employee_out(_get_employee(db, employee.id))


@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    body: EmployeeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    employee = _get_employee(db, employee_id)
    fields = body.model_dump(exclude_unset=True)
    department_id = fields.get("department_id", employee.department_id)
    designation_id = fields.get("designation_id", employee.designation_id)
    designation = db.get(Designation, designation_id) if designation_id else None
    if designation_id and (designation is None or designation.department_id != department_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Designation must belong to the selected department")
    if fields.get("manager_id") == employee.id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "An employee cannot be their own manager")
    _validate_manager(db, fields.get("manager_id", employee.manager_id))
    _apply_employee_fields(employee, fields, user.id)
    commit_or_conflict(db)
    return employee_out(_get_employee(db, employee_id))


@router.post("/employees/{employee_id}/archive")
def archive_employee_route(
    employee_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    try:
        archive_employee(db, employee_id)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    return {"message": "Employee archived successfully"}


@router.get("/departments")
def list_departments(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Department)
    count_stmt = select(func.count(Department.id))
    if search:
        criterion = Department.name.ilike(f"%{search.strip()}%")
        stmt = stmt.where(criterion)
        count_stmt = count_stmt.where(criterion)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Department.name).offset(offset).limit(limit)).all()
    return paginate([department_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/departments/list")
def get_department_list(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [department_out(item) for item in db.scalars(select(Department).order_by(Department.name)).all()]


@router.get("/departments/{department_id}")
def get_department(department_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.get(Department, department_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")
    return department_out(item)


@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(
    body: DepartmentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = Department(name=body.name.strip(), description=body.description, created_by=user.id)
    db.add(item)
    commit_or_conflict(db)
    return department_out(item)


@router.put("/departments/{department_id}")
def update_department(
    department_id: int,
    body: DepartmentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = db.get(Department, department_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value.strip() if key == "name" and value else value)
    item.updated_by = user.id
    commit_or_conflict(db)
    return department_out(item)


@router.delete("/departments/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = db.get(Department, department_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")
    db.delete(item)
    commit_or_conflict(db)
    return {"message": "Department deleted successfully"}


@router.get("/designations")
def list_designations(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    department_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Designation).options(joinedload(Designation.department))
    count_stmt = select(func.count(Designation.id))
    if search:
        criterion = Designation.name.ilike(f"%{search.strip()}%")
        stmt, count_stmt = stmt.where(criterion), count_stmt.where(criterion)
    if department_id is not None:
        stmt = stmt.where(Designation.department_id == department_id)
        count_stmt = count_stmt.where(Designation.department_id == department_id)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Designation.name).offset(offset).limit(limit)).all()
    return paginate([designation_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/designations/list")
def get_designation_list(
    department_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Designation).options(joinedload(Designation.department))
    if department_id is not None:
        stmt = stmt.where(Designation.department_id == department_id)
    return [designation_out(item) for item in db.scalars(stmt.order_by(Designation.name)).all()]


@router.get("/designations/{designation_id}")
def get_designation(designation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.scalar(select(Designation).options(joinedload(Designation.department)).where(Designation.id == designation_id))
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    return designation_out(item)


@router.post("/designations", status_code=status.HTTP_201_CREATED)
def create_designation(
    body: DesignationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    if db.get(Department, body.department_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Department not found")
    item = Designation(
        name=body.name.strip(), description=body.description,
        department_id=body.department_id, created_by=user.id,
    )
    db.add(item)
    commit_or_conflict(db)
    return designation_out(db.scalar(
        select(Designation).options(joinedload(Designation.department)).where(Designation.id == item.id)
    ))


@router.put("/designations/{designation_id}")
def update_designation(
    designation_id: int,
    body: DesignationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = db.get(Designation, designation_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    fields = body.model_dump(exclude_unset=True)
    department_id = fields.get("department_id", item.department_id)
    if db.get(Department, department_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Department not found")
    for key, value in fields.items():
        setattr(item, key, value.strip() if key == "name" and value else value)
    item.updated_by = user.id
    commit_or_conflict(db)
    return designation_out(db.scalar(
        select(Designation).options(joinedload(Designation.department)).where(Designation.id == item.id)
    ))


@router.delete("/designations/{designation_id}")
def delete_designation(
    designation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = db.get(Designation, designation_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    db.delete(item)
    commit_or_conflict(db)
    return {"message": "Designation deleted successfully"}


def former_employee_out(item: OldEmployee, db: Session) -> dict:
    project_history = db.scalars(
        select(OldEmployeeProject).where(OldEmployeeProject.old_employee_id == item.id)
    ).all()
    leave_history = db.scalars(
        select(LeaveRequest).where(LeaveRequest.old_employee_id == item.id)
    ).all()
    return {
        "id": item.id,
        "employee_code": item.employee_code,
        "first_name": item.first_name,
        "last_name": item.last_name,
        "email": item.email or "",
        "phone": item.phone or "",
        "date_of_birth": item.date_of_birth.isoformat() if item.date_of_birth else "",
        "gender": enum_value(item.gender).upper() if item.gender else "OTHER",
        "address": item.address or "",
        "skills": ", ".join(item.skills or []) if isinstance(item.skills, list) else (item.skills or ""),
        "emergency_contact": " ".join(filter(None, (item.emergency_contact_name, item.emergency_contact_phone))),
        "joining_date": item.date_of_joining.isoformat(),
        "leaving_date": item.date_of_leaving.isoformat(),
        "archived_at": item.archived_at.isoformat(),
        "department_name": item.department_name or "",
        "designation_name": item.designation_name or "",
        "manager_name": item.manager_name,
        "project_history": [{
            "project_name": project.project_name,
            "project_role": project.project_role or "",
            "start_date": project.assigned_at.isoformat() if project.assigned_at else "",
            "end_date": project.removed_at.isoformat() if project.removed_at else "",
            "status": enum_value(project.project_status).upper() if project.project_status else "PLANNING",
        } for project in project_history],
        "leave_history": [{
            "leave_type": request.leave_type.name,
            "start_date": request.start_date.isoformat(),
            "end_date": request.end_date.isoformat(),
            "days": float(request.number_of_days),
            "status": enum_value(request.status).upper(),
            "reason": request.reason or "",
        } for request in leave_history],
    }


@router.get("/former-employees")
def list_former_employees(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    stmt = select(OldEmployee)
    count_stmt = select(func.count(OldEmployee.id))
    if search:
        pattern = f"%{search.strip()}%"
        criterion = or_(
            OldEmployee.first_name.ilike(pattern),
            OldEmployee.last_name.ilike(pattern),
            OldEmployee.employee_code.ilike(pattern),
            OldEmployee.department_name.ilike(pattern),
        )
        stmt, count_stmt = stmt.where(criterion), count_stmt.where(criterion)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(OldEmployee.archived_at.desc()).offset(offset).limit(limit)).all()
    return paginate([former_employee_out(item, db) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/former-employees/{employee_id}")
def get_former_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = db.get(OldEmployee, employee_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Former employee not found")
    return former_employee_out(item, db)
