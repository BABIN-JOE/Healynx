from sqlmodel import Field, Column
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime
from sqlalchemy import LargeBinary, JSON

from .base import SQLModelBase


class DoctorRequest(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # doctor → hospital linking (doctor joins hospital)
    hospital_id: Optional[UUID] = None

    first_name: str = Field(..., nullable=False)
    middle_name: Optional[str] = None
    last_name: str = Field(..., nullable=False)
    dob: str = Field(..., nullable=False)
    gender: str = Field(..., nullable=False)
    specialization: str = Field(..., nullable=False)

    aadhaar_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    aadhaar_hash: str = Field(index=True, nullable=False)

    license_number: str = Field(..., nullable=False)

    phone_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    phone_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    email_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    email_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    address_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))

    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    status: str = Field(default="pending")
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None

    password_hash: Optional[str] = None
    extra: Optional[dict] = Field(default=None, sa_column=Column(JSON))


class Doctor(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    first_name: str = Field(..., nullable=False)
    middle_name: Optional[str] = None
    last_name: str = Field(..., nullable=False)
    dob: str = Field(..., nullable=False)
    gender: str = Field(..., nullable=False)
    specialization: str = Field(..., nullable=False)

    aadhaar_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    aadhaar_hash: str = Field(index=True, nullable=False)

    license_number: str = Field(unique=True, index=True, nullable=False)

    phone_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    phone_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    email_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    email_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    address_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))

    password_hash: Optional[str] = None

    created_by: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    approved_by: Optional[UUID] = Field(default=None, foreign_key="admin.id")
    approved_at: Optional[datetime] = None

    is_active: bool = Field(default=True)
