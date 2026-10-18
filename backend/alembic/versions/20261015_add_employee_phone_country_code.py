"""Store employee phone country codes separately.

Revision ID: 20261015_phone_country_code
Revises: 2ac4d8e19f36
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20261015_phone_country_code"
down_revision: Union[str, Sequence[str], None] = "6b781285d02e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("employees", sa.Column("phone_country_code", sa.String(length=4), nullable=True))
    op.add_column("old_employees", sa.Column("phone_country_code", sa.String(length=4), nullable=True))


def downgrade() -> None:
    op.drop_column("old_employees", "phone_country_code")
    op.drop_column("employees", "phone_country_code")
