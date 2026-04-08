"""BASELINE

Revision ID: d6fa45ad16fd
Revises: 
Create Date: 2025-11-29 14:56:41.964316

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd6fa45ad16fd'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # -----------------------------
    # ADMIN
    # -----------------------------
    op.add_column('admin', sa.Column('phone_hash', sa.String(64), nullable=True))
    op.add_column('admin', sa.Column('email_hash', sa.String(64), nullable=True))

    op.alter_column('admin', 'gender', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('admin', 'dob', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('admin', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('admin', 'aadhaar_hash', existing_type=sa.VARCHAR(), nullable=False)

    op.create_index('ix_admin_email_hash', 'admin', ['email_hash'])
    op.create_index('ix_admin_phone_hash', 'admin', ['phone_hash'])

    # -----------------------------
    # DOCTOR
    # -----------------------------
    op.add_column('doctor', sa.Column('phone_hash', sa.String(64), nullable=True))
    op.add_column('doctor', sa.Column('email_hash', sa.String(64), nullable=True))

    op.alter_column('doctor', 'dob', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('doctor', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('doctor', 'phone_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('doctor', 'email_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('doctor', 'address_encrypted', existing_type=postgresql.BYTEA(), nullable=False)

    op.create_index('ix_doctor_email_hash', 'doctor', ['email_hash'])
    op.create_index('ix_doctor_phone_hash', 'doctor', ['phone_hash'])

    # -----------------------------
    # DOCTOR REQUEST
    # -----------------------------
    op.add_column('doctorrequest', sa.Column('phone_hash', sa.String(64), nullable=True))
    op.add_column('doctorrequest', sa.Column('email_hash', sa.String(64), nullable=True))

    op.alter_column('doctorrequest', 'dob', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('doctorrequest', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('doctorrequest', 'phone_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('doctorrequest', 'email_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('doctorrequest', 'address_encrypted', existing_type=postgresql.BYTEA(), nullable=False)

    op.create_index('ix_doctorrequest_email_hash', 'doctorrequest', ['email_hash'])
    op.create_index('ix_doctorrequest_phone_hash', 'doctorrequest', ['phone_hash'])

    # -----------------------------
    # HOSPITAL
    # -----------------------------
    op.add_column('hospital', sa.Column('phone_hash', sa.String(64), nullable=True))
    op.add_column('hospital', sa.Column('email_hash', sa.String(64), nullable=True))

    op.alter_column('hospital', 'owner_aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=False)

    op.create_index('ix_hospital_email_hash', 'hospital', ['email_hash'])
    op.create_index('ix_hospital_phone_hash', 'hospital', ['phone_hash'])

    # -----------------------------
    # HOSPITAL-DOCTOR MAP
    # -----------------------------
    op.add_column('hospitaldoctormap', sa.Column('phone_hash', sa.String(64), nullable=True))
    op.add_column('hospitaldoctormap', sa.Column('email_hash', sa.String(64), nullable=True))

    op.create_index('ix_hospitaldoctormap_email_hash', 'hospitaldoctormap', ['email_hash'])
    op.create_index('ix_hospitaldoctormap_phone_hash', 'hospitaldoctormap', ['phone_hash'])

    # -----------------------------
    # HOSPITAL REQUEST
    # -----------------------------
    op.add_column('hospitalrequest', sa.Column('phone_hash', sa.String(64), nullable=True))
    op.add_column('hospitalrequest', sa.Column('email_hash', sa.String(64), nullable=True))

    op.alter_column('hospitalrequest', 'owner_aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=False)

    op.create_index('ix_hospitalrequest_email_hash', 'hospitalrequest', ['email_hash'])
    op.create_index('ix_hospitalrequest_phone_hash', 'hospitalrequest', ['phone_hash'])

    # -----------------------------
    # PATIENT
    # -----------------------------
    op.alter_column('patient', 'gender', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('patient', 'dob', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('patient', 'father_name', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('patient', 'mother_name', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('patient', 'phone_encrypted', existing_type=postgresql.BYTEA(), nullable=False)
    op.alter_column('patient', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=False)


def downgrade() -> None:

    # PATIENT
    op.alter_column('patient', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('patient', 'phone_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('patient', 'mother_name', existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('patient', 'father_name', existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('patient', 'dob', existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('patient', 'gender', existing_type=sa.VARCHAR(), nullable=True)

    # HOSPITAL REQUEST
    op.drop_index('ix_hospitalrequest_phone_hash', table_name='hospitalrequest')
    op.drop_index('ix_hospitalrequest_email_hash', table_name='hospitalrequest')
    op.alter_column('hospitalrequest', 'owner_aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.drop_column('hospitalrequest', 'email_hash')
    op.drop_column('hospitalrequest', 'phone_hash')

    # HOSPITAL DOCTOR MAP
    op.drop_index('ix_hospitaldoctormap_phone_hash', table_name='hospitaldoctormap')
    op.drop_index('ix_hospitaldoctormap_email_hash', table_name='hospitaldoctormap')
    op.drop_column('hospitaldoctormap', 'email_hash')
    op.drop_column('hospitaldoctormap', 'phone_hash')

    # HOSPITAL
    op.drop_index('ix_hospital_phone_hash', table_name='hospital')
    op.drop_index('ix_hospital_email_hash', table_name='hospital')
    op.alter_column('hospital', 'owner_aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.drop_column('hospital', 'email_hash')
    op.drop_column('hospital', 'phone_hash')

    # DOCTOR REQUEST
    op.drop_index('ix_doctorrequest_phone_hash', table_name='doctorrequest')
    op.drop_index('ix_doctorrequest_email_hash', table_name='doctorrequest')
    op.alter_column('doctorrequest', 'address_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctorrequest', 'email_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctorrequest', 'phone_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctorrequest', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctorrequest', 'dob', existing_type=sa.VARCHAR(), nullable=True)
    op.drop_column('doctorrequest', 'email_hash')
    op.drop_column('doctorrequest', 'phone_hash')

    # DOCTOR
    op.drop_index('ix_doctor_phone_hash', table_name='doctor')
    op.drop_index('ix_doctor_email_hash', table_name='doctor')
    op.alter_column('doctor', 'address_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctor', 'email_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctor', 'phone_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctor', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('doctor', 'dob', existing_type=sa.VARCHAR(), nullable=True)
    op.drop_column('doctor', 'email_hash')
    op.drop_column('doctor', 'phone_hash')

    # ADMIN
    op.drop_index('ix_admin_phone_hash', table_name='admin')
    op.drop_index('ix_admin_email_hash', table_name='admin')
    op.alter_column('admin', 'aadhaar_hash', existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('admin', 'aadhaar_encrypted', existing_type=postgresql.BYTEA(), nullable=True)
    op.alter_column('admin', 'dob', existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column('admin', 'gender', existing_type=sa.VARCHAR(), nullable=True)
    op.drop_column('admin', 'email_hash')
    op.drop_column('admin', 'phone_hash')
