"""Add opaque public UUIDs to API-visible records.

Revision ID: 20261016_public_uuid_ids
Revises: 20261015_inactive_employees
"""
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision: str = "20261016_public_uuid_ids"
down_revision: Union[str, Sequence[str], None] = "20261015_inactive_employees"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PUBLIC_ID_TABLES = (
    "users",
    "employees",
    "departments",
    "designations",
    "projects",
    "project_members",
    "leave_requests",
    "leave_types",
)


def upgrade() -> None:
    connection = op.get_bind()
    for table_name in PUBLIC_ID_TABLES:
        op.add_column(table_name, sa.Column("public_id", sa.String(length=36), nullable=True))
        rows = connection.execute(sa.text(f"SELECT id FROM {table_name}")).scalars().all()
        for row_id in rows:
            connection.execute(
                sa.text(f"UPDATE {table_name} SET public_id = :public_id WHERE id = :row_id"),
                {"public_id": str(uuid4()), "row_id": row_id},
            )
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.alter_column(
                "public_id",
                existing_type=sa.String(length=36),
                nullable=False,
            )
            batch_op.create_unique_constraint(
                f"uq_{table_name}_public_id",
                ["public_id"],
            )


def downgrade() -> None:
    for table_name in reversed(PUBLIC_ID_TABLES):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_constraint(f"uq_{table_name}_public_id", type_="unique")
            batch_op.drop_column("public_id")
