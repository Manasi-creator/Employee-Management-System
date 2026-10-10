# app/models/leave.py
from app.models import OldEmployee
from app.models import Employee
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import (BigInteger, String, Text, Date, DateTime, Enum, Integer,
                        Numeric, ForeignKey, CheckConstraint)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, PrimaryKeyType, TimestampMixin, LeaveStatus

class LeaveType(Base):
    __tablename__ = "leave_types"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    annual_balance: Mapped[int] = mapped_column(Integer)

class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"
    __table_args__ = (CheckConstraint(
        "(employee_id IS NOT NULL) <> (old_employee_id IS NOT NULL)", name="ck_leave_owner"),)
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"))
    old_employee_id: Mapped[int | None] = mapped_column(ForeignKey("old_employees.id"))
    leave_type_id: Mapped[int] = mapped_column(ForeignKey("leave_types.id"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    number_of_days: Mapped[Decimal] = mapped_column(Numeric(4, 1))
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus), default=LeaveStatus.pending)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    approver_remarks: Mapped[str | None] = mapped_column(Text)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)

    employee: Mapped["Employee | None"] = relationship(back_populates="leave_requests")
    old_employee: Mapped["OldEmployee | None"] = relationship(back_populates="leave_requests")
    leave_type: Mapped["LeaveType"] = relationship()