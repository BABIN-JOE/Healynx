import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class ImmunizationPending(SQLModel, table=True):
    __tablename__ = "immunization_pending"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    hospital_id: uuid.UUID

    vaccine_name: str
    reason: Optional[str] = None
    dosage: Optional[str] = None

    vaccination_date: datetime
    notes: Optional[str] = None

    status: str = "pending"
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    decline_reason: Optional[str] = None
    revision_count: int = 0
    expires_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
