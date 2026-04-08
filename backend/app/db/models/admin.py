from sqlmodel import Field, Column
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime
from sqlalchemy import LargeBinary

from .base import SQLModelBase


class Admin(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # required fields (non-nullable)
    first_name: str = Field(..., nullable=False)
    middle_name: Optional[str] = None
    last_name: str = Field(..., nullable=False)
    gender: str = Field(..., nullable=False)
    dob: str = Field(..., nullable=False)

    aadhaar_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    aadhaar_hash: str = Field(default=None, index=True, nullable=False)

    phone_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    phone_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    email_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))
    email_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    address_encrypted: bytes = Field(sa_column=Column(LargeBinary, nullable=False))

    username: str = Field(index=True, unique=True, nullable=False)
    password_hash: str = Field(nullable=False)

    created_by: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    is_active: bool = Field(default=True)
    is_blocked: bool = Field(default=False)
