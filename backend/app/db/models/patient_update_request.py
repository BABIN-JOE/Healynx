from app.core.time import utcnow
from sqlmodel import Field, Column
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import JSON

from .base import SQLModelBase


class PatientUpdateRequest(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    patient_id: UUID = Field(index=True)
    doctor_id: UUID = Field(index=True)
    hospital_id: UUID = Field(index=True)

    status: str = Field(default="pending", index=True)

    requested_changes: dict = Field(
        sa_column=Column(JSON, nullable=False)
    )

    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(
        default_factory=lambda: utcnow() + timedelta(hours=24)
    )
