"""add doctor_visible_until to medical_entry_pending

Revision ID: 0abe0974dede
Revises: add_gender_specialization_doctor
Create Date: 2026-02-09 14:33:07.352309
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0abe0974dede"
down_revision: Union[str, Sequence[str], None] = "add_gender_specialization_doctor"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema.
    Only adds doctor_visible_until column for doctor-side visibility window.
    """

    op.add_column(
        "medicalentrypending",
        sa.Column(
            "doctor_visible_until",
            sa.DateTime(timezone=False),
            nullable=True
        ),
    )

    op.create_index(
        "ix_medicalentrypending_doctor_visible_until",
        "medicalentrypending",
        ["doctor_visible_until"],
        unique=False,
    )


def downgrade() -> None:
    """
    Downgrade schema.
    """

    op.drop_index(
        "ix_medicalentrypending_doctor_visible_until",
        table_name="medicalentrypending",
    )

    op.drop_column(
        "medicalentrypending",
        "doctor_visible_until",
    )
