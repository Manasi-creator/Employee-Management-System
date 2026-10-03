from datetime import date
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models import (Employee, OldEmployee, OldEmployeeProject,
                        ProjectMember, LeaveRequest)

def archive_employee(db: Session, employee_id: int) -> OldEmployee:
    emp = db.scalar(
        select(Employee).where(Employee.id == employee_id).options(
            joinedload(Employee.user), joinedload(Employee.department),
            joinedload(Employee.designation), joinedload(Employee.manager),
            selectinload(Employee.team),
            selectinload(Employee.project_links).joinedload(ProjectMember.project)))
    if emp is None:
        raise LookupError("Employee not found")
    if emp.team:
        raise ValueError("Reassign this manager's team before archiving")

    try:
        old = OldEmployee(
            original_employee_id=emp.id, employee_code=emp.employee_code,
            email=emp.user.email,
            first_name=emp.first_name, last_name=emp.last_name, phone=emp.phone,
            date_of_birth=emp.date_of_birth, gender=emp.gender, address=emp.address,
            skills=emp.skills, emergency_contact_name=emp.emergency_contact_name,
            emergency_contact_phone=emp.emergency_contact_phone,
            date_of_joining=emp.date_of_joining, date_of_leaving=date.today(),
            department_name=emp.department.name if emp.department else None,
            designation_name=emp.designation.name if emp.designation else None,
            manager_name=f"{emp.manager.first_name} {emp.manager.last_name}" if emp.manager else None,
            original_role=emp.user.role)
        db.add(old); db.flush()

        for link in list(emp.project_links):
            db.add(OldEmployeeProject(
                old_employee_id=old.id, project_name=link.project.name,
                project_description=link.project.description,
                project_role=link.project_role, project_status=link.project.status,
                assigned_at=link.assigned_at.date(), removed_at=date.today()))
            db.delete(link)

        db.execute(update(LeaveRequest)
                   .where(LeaveRequest.employee_id == emp.id)
                   .values(employee_id=None, old_employee_id=old.id))

        emp.user.is_active = False      # keep the user row for audit FKs
        db.flush()
        db.delete(emp)
        db.commit()
        return old
    except Exception:
        db.rollback()
        raise