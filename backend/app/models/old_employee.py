# app/models/old_employee.py  (archive tables)
from datetime import date, datetime
from sqlalchemy import BigInteger, String, Text, Date, DateTime, Enum, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, PrimaryKeyType, Gender, Role, ProjectStatus

class OldEmployee(Base):
    __tablename__ = "old_employees"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    original_employee_id: Mapped[int] = mapped_column(BigInteger, index=True)
    email: Mapped[str | None] = mapped_column(String(255))
    employee_code: Mapped[str] = mapped_column(String(30))
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
    date_of_leaving: Mapped[date] = mapped_column(Date)
    department_name: Mapped[str | None] = mapped_column(String(100))
    designation_name: Mapped[str | None] = mapped_column(String(100))
    manager_name: Mapped[str | None] = mapped_column(String(200))
    original_role: Mapped[Role] = mapped_column(Enum(Role))
    archived_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    projects: Mapped[list["OldEmployeeProject"]] = relationship(back_populates="old_employee")
    leave_requests: Mapped[list["LeaveRequest"]] = relationship(back_populates="old_employee")

class OldEmployeeProject(Base):
    __tablename__ = "old_employee_projects"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    old_employee_id: Mapped[int] = mapped_column(ForeignKey("old_employees.id"))
    project_name: Mapped[str] = mapped_column(String(150))
    project_description: Mapped[str | None] = mapped_column(Text)
    project_role: Mapped[str | None] = mapped_column(String(100))
    project_status: Mapped[ProjectStatus | None] = mapped_column(Enum(ProjectStatus))
    assigned_at: Mapped[date | None] = mapped_column(Date)
    removed_at: Mapped[date | None] = mapped_column(Date)

    old_employee: Mapped["OldEmployee"] = relationship(back_populates="projects")