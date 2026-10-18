from datetime import date
from uuid import UUID

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
    find_by_public_id,
    page_bounds,
    paginate,
)

router = APIRouter(tags=["Employees", "Organization", "Archived employees"])


def department_out(department: Department | None) -> dict | None:
    if department is None:
        return None
    return {
        "id": department.public_id,
        "name": department.name,
        "description": department.description or "",
        "created_at": department.created_at.isoformat(),
        "updated_at": department.updated_at.isoformat(),
    }


def designation_out(designation: Designation | None) -> dict | None:
    if designation is None:
        return None
    return {
        "id": designation.public_id,
        "name": designation.name,
        "description": designation.description or "",
        "department_id": designation.department.public_id,
        "department": department_out(designation.department),
        "created_at": designation.created_at.isoformat(),
        "updated_at": designation.updated_at.isoformat(),
    }


def employee_summary_out(employee: Employee | None) -> dict | None:
    if employee is None:
        return None
    return {
        "id": employee.public_id,
        "employee_code": employee.employee_code,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.user.email,
        "department": department_out(employee.department),
        "designation": designation_out(employee.designation),
    }


def employee_out(employee: Employee) -> dict:
    return {
        "id": employee.public_id,
        "employee_code": employee.employee_code,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.user.email,
        "phone": employee.phone or "",
        "country_code": employee.phone_country_code or "",
        "date_of_birth": employee.date_of_birth.isoformat() if employee.date_of_birth else "",
        "gender": enum_value(employee.gender).upper() if employee.gender else "OTHER",
        "address": employee.address or "",
        "skills": ", ".join(employee.skills or []) if isinstance(employee.skills, list) else (employee.skills or ""),
        "emergency_contact": " ".join(filter(None, (
            employee.emergency_contact_name, employee.emergency_contact_phone
        ))),
        "joining_date": employee.date_of_joining.isoformat(),
        "department_id": employee.department.public_id if employee.department else None,
        "designation_id": employee.designation.public_id if employee.designation else None,
        "manager_id": employee.manager.public_id if employee.manager else None,
        "status": enum_value(employee.status).upper(),
        "user_id": employee.user.public_id,
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
    if "country_code" in fields:
        fields["phone_country_code"] = f"+{fields.pop('country_code').lstrip('+')}"
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


def _validate_manager(db: Session, manager_id: UUID | str | None) -> int | None:
    if manager_id is None:
        return None
    manager = db.scalar(
        select(Employee)
        .join(Employee.user)
        .where(
            Employee.public_id == str(manager_id),
            Employee.status == EmployeeStatus.active,
            User.role == Role.manager,
            User.is_active.is_(True),
        )
    )
    if manager is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "manager_id must identify a manager")
    return manager.id


def _resolve_related_id(db: Session, model: type, public_id: UUID | None, label: str) -> int | None:
    if public_id is None:
        return None
    related = find_by_public_id(db, model, public_id)
    if related is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"{label} not found")
    return related.id


def generate_next_employee_code(db: Session) -> str:
    emp_codes = db.scalars(select(Employee.employee_code)).all()
    max_num = -1
    for code in emp_codes:
        if code and code.startswith("EMP"):
            digits = "".join(filter(str.isdigit, code[3:]))
            if digits:
                max_num = max(max_num, int(digits))
    next_num = max_num + 1 if max_num >= 0 else 1
    return f"EMP{next_num:03d}"


@router.get("/employees/next-code")
def get_next_employee_code(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    return {"employee_code": generate_next_employee_code(db)}


@router.get("/employees")
def list_employees(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    department_id: UUID | None = None,
    designation_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr, Role.manager)),
):
    stmt = _employee_query()
    count_stmt = select(func.count(Employee.id))
    department_filter_id = None
    designation_filter_id = None
    if user.role == Role.manager:
        if user.employee is None:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Manager account has no employee profile")
        team_scope = Employee.manager_id == user.employee.id
        stmt = stmt.where(team_scope)
        count_stmt = count_stmt.where(team_scope)
    if department_id is not None:
        department = find_by_public_id(db, Department, department_id)
        department_filter_id = department.id if department is not None else -1
    if designation_id is not None:
        designation = find_by_public_id(db, Designation, designation_id)
        designation_filter_id = designation.id if designation is not None else -1

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
    if department_filter_id is not None:
        stmt = stmt.where(Employee.department_id == department_filter_id)
        count_stmt = count_stmt.where(Employee.department_id == department_filter_id)
    if designation_filter_id is not None:
        stmt = stmt.where(Employee.designation_id == designation_filter_id)
        count_stmt = count_stmt.where(Employee.designation_id == designation_filter_id)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Employee.id.desc()).offset(offset).limit(limit)).unique().all()
    return paginate([employee_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/employees/managers")
def list_managers(
    page: int = 1,
    page_size: int = Query(default=10, le=100),
    search: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    department_id: UUID | None = None,
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
    if status_filter:
        value = enum_from_name(EmployeeStatus, status_filter, "status")
        stmt = stmt.where(Employee.status == value)
        count_stmt = count_stmt.where(Employee.status == value)
    if department_id is not None:
        department = find_by_public_id(db, Department, department_id)
        department_filter_id = department.id if department is not None else -1
        stmt = stmt.where(Employee.department_id == department_filter_id)
        count_stmt = count_stmt.where(Employee.department_id == department_filter_id)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Employee.id.desc()).offset(offset).limit(limit)).unique().all()
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
    if user.employee.department_id is None:
        return paginate([], 0, page, page_size)
    stmt = _employee_query().where(
        Employee.manager_id == user.employee.id,
        Employee.department_id == user.employee.department_id,
        Employee.status == EmployeeStatus.active,
    )
    count_stmt = select(func.count(Employee.id)).where(
        Employee.manager_id == user.employee.id,
        Employee.department_id == user.employee.department_id,
        Employee.status == EmployeeStatus.active,
    )
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
    records = db.scalars(stmt.order_by(Employee.id.desc()).offset(offset).limit(limit)).unique().all()
    return paginate([employee_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/employees/{employee_id}")
def get_employee(
    employee_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    employee = find_by_public_id(db, Employee, employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    if user.role != Role.hr and employee.user_id != user.id and employee.manager_id != getattr(user.employee, "id", None):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Permission denied")
    return employee_out(employee)


@router.post("/employees", status_code=status.HTTP_201_CREATED)
def create_employee(
    body: EmployeeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    department = find_by_public_id(db, Department, body.department_id) if body.department_id else None
    designation = find_by_public_id(db, Designation, body.designation_id) if body.designation_id else None
    if body.department_id and department is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Department not found")
    if body.designation_id and (
        designation is None or designation.department_id != getattr(department, "id", None)
    ):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Designation must belong to the selected department")
    manager_id = _validate_manager(db, body.manager_id)
    role = enum_from_name(Role, body.role, "role")
    account = User(
        email=str(body.email).lower(),
        password_hash=hash_password(body.password),
        role=role,
        is_first_login=True,
    )
    db.add(account)
    db.flush()
    emp_code = (body.employee_code.strip() if body.employee_code and body.employee_code.strip() else generate_next_employee_code(db))
    employee = Employee(
        user_id=account.id,
        employee_code=emp_code,
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        phone=body.phone,
        phone_country_code=f"+{body.country_code.lstrip('+')}",
        date_of_birth=body.date_of_birth,
        gender=enum_from_name(Gender, body.gender, "gender") if body.gender else None,
        address=body.address,
        skills=[item.strip() for item in body.skills.split(",") if item.strip()] if body.skills else [],
        emergency_contact_name=body.emergency_contact,
        date_of_joining=body.joining_date,
        department_id=department.id if department else None,
        designation_id=designation.id if designation else None,
        manager_id=manager_id,
        status=enum_from_name(EmployeeStatus, body.status, "status"),
        created_by=user.id,
    )
    db.add(employee)
    commit_or_conflict(db)
    return employee_out(_get_employee(db, employee.id))


@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: UUID,
    body: EmployeeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    employee = find_by_public_id(db, Employee, employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    fields = body.model_dump(exclude_unset=True)
    if "department_id" in fields:
        fields["department_id"] = _resolve_related_id(
            db, Department, fields["department_id"], "Department"
        )
    if "designation_id" in fields:
        designation_id = fields["designation_id"]
        designation = find_by_public_id(db, Designation, designation_id) if designation_id else None
        if designation_id and designation is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Designation not found")
        fields["designation_id"] = designation.id if designation else None
    department_id = fields.get("department_id", employee.department_id)
    designation_id = fields.get("designation_id", employee.designation_id)
    if designation_id and ("department_id" in fields or "designation_id" in fields):
        designation = db.get(Designation, designation_id)
        if designation is None or designation.department_id != department_id:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Designation must belong to the selected department")
    if "manager_id" in fields:
        manager_id = _validate_manager(db, fields["manager_id"])
        if manager_id == employee.id:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "An employee cannot be their own manager")
        fields["manager_id"] = manager_id
    _apply_employee_fields(employee, fields, user.id)
    if "status" in fields and fields["status"] is not None:
        employee.user.is_active = employee.status == EmployeeStatus.active
    commit_or_conflict(db)
    return employee_out(_get_employee(db, employee.id))


@router.post("/employees/{employee_id}/archive")
def archive_employee_route(
    employee_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    employee = find_by_public_id(db, Employee, employee_id)
    if employee is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    try:
        archive_employee(db, employee.id)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return {"message": "Employee marked as inactive"}


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
def get_department(department_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = find_by_public_id(db, Department, department_id)
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
    department_id: UUID,
    body: DepartmentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = find_by_public_id(db, Department, department_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value.strip() if key == "name" and value else value)
    item.updated_by = user.id
    commit_or_conflict(db)
    return department_out(item)


@router.delete("/departments/{department_id}")
def delete_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = find_by_public_id(db, Department, department_id)
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
    department_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Designation).options(joinedload(Designation.department))
    count_stmt = select(func.count(Designation.id))
    if search:
        criterion = Designation.name.ilike(f"%{search.strip()}%")
        stmt, count_stmt = stmt.where(criterion), count_stmt.where(criterion)
    if department_id is not None:
        department = find_by_public_id(db, Department, department_id)
        department_filter_id = department.id if department is not None else -1
        stmt = stmt.where(Designation.department_id == department_filter_id)
        count_stmt = count_stmt.where(Designation.department_id == department_filter_id)
    offset, limit = page_bounds(page, page_size)
    records = db.scalars(stmt.order_by(Designation.name).offset(offset).limit(limit)).all()
    return paginate([designation_out(item) for item in records], db.scalar(count_stmt) or 0, page, page_size)


@router.get("/designations/list")
def get_designation_list(
    department_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Designation).options(joinedload(Designation.department))
    if department_id is not None:
        department = find_by_public_id(db, Department, department_id)
        stmt = stmt.where(Designation.department_id == (department.id if department else -1))
    return [designation_out(item) for item in db.scalars(stmt.order_by(Designation.name)).all()]


@router.get("/designations/{designation_id}")
def get_designation(designation_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.scalar(
        select(Designation)
        .options(joinedload(Designation.department))
        .where(Designation.public_id == str(designation_id))
    )
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    return designation_out(item)


@router.post("/designations", status_code=status.HTTP_201_CREATED)
def create_designation(
    body: DesignationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    department = find_by_public_id(db, Department, body.department_id)
    if department is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Department not found")
    item = Designation(
        name=body.name.strip(), description=body.description,
        department_id=department.id, created_by=user.id,
    )
    db.add(item)
    commit_or_conflict(db)
    return designation_out(db.scalar(
        select(Designation).options(joinedload(Designation.department)).where(Designation.id == item.id)
    ))


@router.put("/designations/{designation_id}")
def update_designation(
    designation_id: UUID,
    body: DesignationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = find_by_public_id(db, Designation, designation_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    fields = body.model_dump(exclude_unset=True)
    if "department_id" in fields:
        fields["department_id"] = _resolve_related_id(
            db, Department, fields["department_id"], "Department"
        )
    for key, value in fields.items():
        setattr(item, key, value.strip() if key == "name" and value else value)
    item.updated_by = user.id
    commit_or_conflict(db)
    return designation_out(db.scalar(
        select(Designation).options(joinedload(Designation.department)).where(Designation.id == item.id)
    ))


@router.delete("/designations/{designation_id}")
def delete_designation(
    designation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(Role.hr)),
):
    item = find_by_public_id(db, Designation, designation_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Designation not found")
    db.delete(item)
    commit_or_conflict(db)
    return {"message": "Designation deleted successfully"}
