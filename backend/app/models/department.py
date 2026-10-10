# app/models/department.py
from app.models import Employee
from sqlalchemy import BigInteger, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, PrimaryKeyType, TimestampMixin, AuditMixin

class Department(Base, TimestampMixin, AuditMixin):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str | None] = mapped_column(Text)

    designations: Mapped[list["Designation"]] = relationship(back_populates="department")
    employees: Mapped[list["Employee"]] = relationship(back_populates="department")

class Designation(Base, TimestampMixin, AuditMixin):
    __tablename__ = "designations"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))

    department: Mapped["Department"] = relationship(back_populates="designations")
    employees: Mapped[list["Employee"]] = relationship(back_populates="designation")