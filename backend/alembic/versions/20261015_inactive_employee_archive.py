"""Replace archived employee tables with employee status.

Revision ID: 20261015_inactive_employees
Revises: 20261015_phone_country_code
"""
from collections import defaultdict
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261015_inactive_employees"
down_revision: Union[str, Sequence[str], None] = "20261015_phone_country_code"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _enum_value(value) -> str | None:
    return getattr(value, "value", value)


def upgrade() -> None:
    bind = op.get_bind()
    metadata = sa.MetaData()
    employees = sa.Table("employees", metadata, autoload_with=bind)
    users = sa.Table("users", metadata, autoload_with=bind)
    old_employees = sa.Table("old_employees", metadata, autoload_with=bind)
    departments = sa.Table("departments", metadata, autoload_with=bind)
    designations = sa.Table("designations", metadata, autoload_with=bind)
    leave_requests = sa.Table("leave_requests", metadata, autoload_with=bind)

    old_rows = bind.execute(sa.select(old_employees).order_by(
        old_employees.c.original_employee_id
    )).mappings().all()
    current_rows = bind.execute(sa.select(
        employees.c.id, employees.c.employee_code, employees.c.user_id
    )).mappings().all()
    employee_ids = {row["id"] for row in current_rows}
    employee_codes = {row["employee_code"] for row in current_rows}
    linked_user_ids = {row["user_id"] for row in current_rows}
    users_by_email = {
        row["email"].lower(): row
        for row in bind.execute(sa.select(users)).mappings()
    }
    unused_inactive_users = [
        row for row in bind.execute(sa.select(users).where(
            users.c.is_active.is_(False)
        )).mappings()
        if row["id"] not in linked_user_ids
    ]

    user_by_old_row = {}
    used_user_ids = set(linked_user_ids)
    missing_email_rows = defaultdict(list)
    for row in old_rows:
        if row["original_employee_id"] in employee_ids:
            raise RuntimeError(
                f"Cannot migrate archived employee {row['original_employee_id']}: "
                "employee ID is already in use"
            )
        if row["employee_code"] in employee_codes:
            raise RuntimeError(
                f"Cannot migrate archived employee {row['original_employee_id']}: "
                "employee code is already in use"
            )

        if row["email"]:
            user = users_by_email.get(row["email"].lower())
            if user is None or user["id"] in used_user_ids or user["is_active"]:
                raise RuntimeError(
                    f"Cannot locate a unique inactive account for archived employee "
                    f"{row['original_employee_id']}"
                )
            user_by_old_row[row["original_employee_id"]] = user
            used_user_ids.add(user["id"])
        else:
            role = _enum_value(row["original_role"])
            missing_email_rows[role].append(row)

    for role, rows in missing_email_rows.items():
        candidates = [
            user for user in unused_inactive_users
            if user["id"] not in used_user_ids
            and _enum_value(user["role"]) == role
        ]
        if len(rows) != 1 or len(candidates) != 1:
            raise RuntimeError(
                "Cannot safely match archived employees without email addresses "
                "to their inactive user accounts"
            )
        for old_row, user in zip(rows, candidates):
            user_by_old_row[old_row["original_employee_id"]] = user
            used_user_ids.add(user["id"])

    department_by_name = {
        row["name"]: row["id"]
        for row in bind.execute(sa.select(departments)).mappings()
    }
    designation_rows = bind.execute(sa.select(designations)).mappings().all()
    designation_by_department_and_name = {
        (row["department_id"], row["name"]): row["id"]
        for row in designation_rows
    }
    designation_ids_by_name = defaultdict(list)
    for row in designation_rows:
        designation_ids_by_name[row["name"]].append(row["id"])

    for row in old_rows:
        user = user_by_old_row[row["original_employee_id"]]
        department_id = department_by_name.get(row["department_name"])
        designation_id = designation_by_department_and_name.get(
            (department_id, row["designation_name"])
        ) if department_id is not None else None
        if designation_id is None and row["designation_name"]:
            matches = designation_ids_by_name[row["designation_name"]]
            if len(matches) == 1:
                designation_id = matches[0]

        bind.execute(employees.insert().values(
            id=row["original_employee_id"],
            user_id=user["id"],
            employee_code=row["employee_code"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            phone=row["phone"],
            phone_country_code=row["phone_country_code"],
            date_of_birth=row["date_of_birth"],
            gender=_enum_value(row["gender"]),
            address=row["address"],
            skills=row["skills"],
            emergency_contact_name=row["emergency_contact_name"],
            emergency_contact_phone=row["emergency_contact_phone"],
            date_of_joining=row["date_of_joining"],
            department_id=department_id,
            designation_id=designation_id,
            manager_id=None,
            status="inactive",
            created_at=row["archived_at"],
            updated_at=row["archived_at"],
        ))
        bind.execute(users.update().where(
            users.c.id == user["id"]
        ).values(is_active=False))

    with op.batch_alter_table("leave_requests") as batch_op:
        batch_op.drop_constraint("ck_leave_owner", type_="check")

    for row in old_rows:
        bind.execute(leave_requests.update().where(
            leave_requests.c.old_employee_id == row["id"]
        ).values(employee_id=row["original_employee_id"]))

    inspector = sa.inspect(bind)
    old_employee_fk = next(
        constraint
        for constraint in inspector.get_foreign_keys("leave_requests")
        if constraint["constrained_columns"] == ["old_employee_id"]
    )
    fk_name = old_employee_fk["name"] or (
        "fk_leave_requests_old_employee_id_old_employees"
    )
    with op.batch_alter_table(
        "leave_requests",
        naming_convention={
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s"
        },
    ) as batch_op:
        batch_op.drop_constraint(fk_name, type_="foreignkey")
        batch_op.drop_column("old_employee_id")

    op.drop_table("old_employee_projects")
    op.drop_table("old_employees")


def downgrade() -> None:
    raise RuntimeError(
        "This migration removes archive history tables and cannot be downgraded."
    )
