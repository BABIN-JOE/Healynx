from alembic import op
import sqlalchemy as sa


# Revision identifiers
revision = 'add_gender_specialization_doctor'
down_revision = 'd6fa45ad16fd'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'doctor',
        sa.Column('gender', sa.String(), nullable=False, server_default='Unknown')
    )
    op.add_column(
        'doctor',
        sa.Column('specialization', sa.String(), nullable=False, server_default='General')
    )

    # Remove default after data inserted
    op.alter_column('doctor', 'gender', server_default=None)
    op.alter_column('doctor', 'specialization', server_default=None)


def downgrade():
    op.drop_column('doctor', 'gender')
    op.drop_column('doctor', 'specialization')
