# app/models/user.py
from datetime import datetime
from sqlalchemy import BigInteger, String, Enum, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, PrimaryKeyType, TimestampMixin, Role

class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(PrimaryKeyType, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_first_login: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime)

    employee: Mapped["Employee | None"] = relationship(
        back_populates="user", foreign_keys="Employee.user_id", uselist=False)

    @property
    def employee_id(self) -> int | None:
        return self.employee.id if self.employee else None