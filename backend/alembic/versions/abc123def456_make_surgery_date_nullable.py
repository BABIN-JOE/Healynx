"""make surgery_date nullable in surgery_pending

Revision ID: abc123def456
Revises: d6fa45ad16fd
Create Date: 2026-04-12 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: str = 'd6fa45ad16fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make surgery_date nullable in surgery_pending
    op.alter_column('surgery_pending', 'surgery_date',
                    existing_type=sa.DateTime(),
                    nullable=True)

    # Also make surgery_date nullable in surgeries table
    op.alter_column('surgeries', 'surgery_date',
                    existing_type=sa.DateTime(),
                    nullable=True)


def downgrade() -> None:
    # Revert surgery_date to not nullable in surgery_pending
    op.alter_column('surgery_pending', 'surgery_date',
                    existing_type=sa.DateTime(),
                    nullable=False)

    # Revert surgery_date to not nullable in surgeries table
    op.alter_column('surgeries', 'surgery_date',
                    existing_type=sa.DateTime(),
                    nullable=False)