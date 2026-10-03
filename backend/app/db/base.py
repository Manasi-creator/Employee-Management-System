import enum
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime

class Base(DeclarativeBase):
    pass

PrimaryKeyType = BigInteger().with_variant(Integer, "sqlite")

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

class AuditMixin:
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))
    updated_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"))

class Role(str, enum.Enum):
    hr = "hr"; manager = "manager"; employee = "employee"

class Gender(str, enum.Enum):
    male = "male"; female = "female"; other = "other"

class EmployeeStatus(str, enum.Enum):
    active = "active"; inactive = "inactive"

class ProjectStatus(str, enum.Enum):
    planned = "planned"; active = "active"; completed = "completed"; on_hold = "on_hold"

class LeaveStatus(str, enum.Enum):
    pending = "pending"; approved = "approved"; rejected = "rejected"; cancelled = "cancelled"