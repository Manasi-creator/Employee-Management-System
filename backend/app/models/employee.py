# app/models/employee.py
from app.models import LeaveRequest
from app.models import ProjectMember
from app.models import Designation
from app.models import Department
from app.models import User
from app.models import Employees
from datetime import date
from sqlalchemy import BigInteger, String, Text, Date, Enum, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, PrimaryKeyType, TimestampMixin, AuditMixin, Gender, EmployeeStatus

class Employee(Base, TimestampMixin, AuditMixin):
    __tablename__ = "employees"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    employee_code: Mapped[str] = mapped_column(String(30), unique=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[Gender | None] = mapped_column(Enum(Gender))
    address: Mapped[str | None] = mapped_column(Text)
    skills: Mapped[list | None] = mapped_column(JSON)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(100))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20))
    date_of_joining: Mapped[date] = mapped_column(Date)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    designation_id: Mapped[int | None] = mapped_column(ForeignKey("designations.id"))
    manager_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"))
    status: Mapped[EmployeeStatus] = mapped_column(Enum(EmployeeStatus), default=EmployeeStatus.active)

    user: Mapped["User"] = relationship(back_populates="employee", foreign_keys=[user_id])
    department: Mapped["Department"] = relationship(back_populates="employees")
    designation: Mapped["Designation"] = relationship(back_populates="employees")
    manager: Mapped["Employee | None"] = relationship(back_populates="team", remote_side=[id])
    team: Mapped[list["Employee"]] = relationship(back_populates="manager")
    project_links: Mapped[list["ProjectMember"]] = relationship(back_populates="employee")
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(back_populates="employee")