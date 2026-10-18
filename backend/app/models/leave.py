# app/models/leave.py
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import (BigInteger, String, Text, Date, DateTime, Enum, Integer,
                        Numeric, ForeignKey)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, PrimaryKeyType, PublicIdMixin, TimestampMixin, LeaveStatus

class LeaveType(Base, PublicIdMixin):
    __tablename__ = "leave_types"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    annual_balance: Mapped[int] = mapped_column(Integer)

class LeaveRequest(Base, PublicIdMixin, TimestampMixin):
    __tablename__ = "leave_requests"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    leave_type_id: Mapped[int] = mapped_column(ForeignKey("leave_types.id"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    number_of_days: Mapped[Decimal] = mapped_column(Numeric(4, 1))
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus), default=LeaveStatus.pending)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    approver_remarks: Mapped[str | None] = mapped_column(Text)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)

    employee: Mapped["Employee"] = relationship(back_populates="leave_requests")
    leave_type: Mapped["LeaveType"] = relationship()
    approver: Mapped["User | None"] = relationship(foreign_keys=[approved_by])