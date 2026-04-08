import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class VisitPending(SQLModel, table=True):
    __tablename__ = "visit_pending"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    hospital_id: uuid.UUID

    parent_visit_id: Optional[uuid.UUID] = None

    visit_date: datetime = Field(default_factory=datetime.utcnow)

    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None

    followup_condition: Optional[str] = None

    medication_name: Optional[str] = None
    medication_start_date: Optional[datetime] = None
    medication_end_date: Optional[datetime] = None

    status: str = "pending"
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    decline_reason: Optional[str] = None
    revision_count: int = 0
    expires_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
