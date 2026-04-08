from sqlmodel import Field, Column
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime
from sqlalchemy import LargeBinary

from .base import SQLModelBase


class HospitalDoctorMap(SQLModelBase, table=True):
    __tablename__ = "hospitaldoctormap"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    hospital_id: UUID
    doctor_id: UUID

    role: Optional[str] = Field(default="doctor")

    phone_encrypted: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))
    phone_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    email_encrypted: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))
    email_hash: Optional[str] = Field(default=None, index=True, nullable=True)

    address_encrypted: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))

    is_active: bool = Field(default=True)
    soft_deleted: bool = Field(default=False)

    added_at: datetime = Field(default_factory=datetime.utcnow)
