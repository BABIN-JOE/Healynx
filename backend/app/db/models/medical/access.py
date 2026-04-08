from sqlmodel import Field, Column
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional
from sqlalchemy import JSON, Column, DateTime

from ..base import SQLModelBase

from app.core.time import utcnow


class PatientAccessRequest(SQLModelBase, table=True):

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    doctor_id: UUID = Field(index=True)
    hospital_id: UUID = Field(index=True)

    patient_aadhaar_hash: str = Field(index=True)

    status: str = Field(default="pending", index=True)

    created_at: datetime = Field(default_factory=utcnow,sa_column=Column(DateTime(timezone=True), nullable=False))

    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False, index=True))

    entry_expires_at: Optional[datetime] = Field(default=None,sa_column=Column(DateTime(timezone=True), index=True))

    reviewed_at: Optional[datetime] = Field(default=None,sa_column=Column(DateTime(timezone=True)))
    reviewed_by: Optional[UUID] = None

    extra: Optional[dict] = Field(default=None, sa_column=Column(JSON))
