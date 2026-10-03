"""Store archived employee email addresses.

Revision ID: 2ac4d8e19f36
Revises: 5de7c948f963
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2ac4d8e19f36"
down_revision: Union[str, Sequence[str], None] = "5de7c948f963"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("old_employees", sa.Column("email", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("old_employees", "email")
