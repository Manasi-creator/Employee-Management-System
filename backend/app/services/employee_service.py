from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.db.base import EmployeeStatus
from app.models import Employee


def archive_employee(db: Session, employee_id: int) -> Employee:
    emp = db.scalar(
        select(Employee)
        .where(Employee.id == employee_id)
        .options(joinedload(Employee.user))
    )
    if emp is None:
        raise LookupError("Employee not found")

    emp.status = EmployeeStatus.inactive
    emp.user.is_active = False
    db.commit()
    return emp