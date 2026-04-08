from sqlmodel import Field, Column
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime
from sqlalchemy import LargeBinary, JSON

from .base import SQLModelBase


class HospitalRequest(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    hospital_name: str = Field(..., nullable=False)
    license_number: str = Field(..., nullable=False)

    owner_first_name: str = Field(..., nullable=False)
    owner_middle_name: Optional[str] = None
    owner_last_name: str = Field(..., nullable=False)

    owner_aadhaar_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    owner_aadhaar_hash: str = Field(index=True, nullable=False)

    phone_encrypted: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))
    phone_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    email_encrypted: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))
    email_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    address_encrypted: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))

    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    status: str = Field(default="pending")  # pending / approved / rejected

    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None

    password_hash: Optional[str] = None
    extra: Optional[dict] = Field(default=None, sa_column=Column(JSON))


class Hospital(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    hospital_name: str = Field(..., nullable=False)
    license_number: str = Field(index=True, unique=True, nullable=False)

    owner_first_name: str = Field(..., nullable=False)
    owner_middle_name: Optional[str] = None
    owner_last_name: str = Field(..., nullable=False)

    owner_aadhaar_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    owner_aadhaar_hash: str = Field(index=True, nullable=False)

    phone_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    phone_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    email_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    email_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    address_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))

    created_by: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    approved_by: Optional[UUID] = Field(default=None, foreign_key="admin.id")
    approved_at: Optional[datetime] = None

    is_active: bool = Field(default=True)
    password_hash: Optional[str] = None
