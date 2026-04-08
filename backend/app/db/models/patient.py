from sqlmodel import Field, Column
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime
from sqlalchemy import LargeBinary, String

from .base import SQLModelBase


class Patient(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    first_name: str = Field(..., nullable=False)
    middle_name: Optional[str] = None
    last_name: str = Field(..., nullable=False)

    gender: str = Field(..., nullable=False)
    dob: str = Field(..., nullable=False)

    father_name: str = Field(..., nullable=False)
    mother_name: str = Field(..., nullable=False)

    blood_group: str = Field(
        sa_column=Column("blood_group", String(5), nullable=False)
    )

    address_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    phone_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    emergency_contact_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    email_encrypted: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))

    aadhaar_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    aadhaar_hash: str = Field(index=True, nullable=False)

    created_by: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    is_active: bool = Field(default=True)
