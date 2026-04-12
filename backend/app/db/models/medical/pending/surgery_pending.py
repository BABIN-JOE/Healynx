import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class SurgeryPending(SQLModel, table=True):
    __tablename__ = "surgery_pending"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    hospital_id: uuid.UUID

    parent_surgery_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="surgeries.id"
    )

    surgery_name: Optional[str] = None
    body_part: Optional[str] = None
    reason: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None

    surgery_date: Optional[datetime] = None
    admit_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None

    followup_condition: Optional[str] = None

    medication_name: Optional[str] = None
    medication_start_date: Optional[datetime] = None
    medication_end_date: Optional[datetime] = None

    # Workflow
    status: str = "pending"
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    decline_reason: Optional[str] = None
    revision_count: int = 0
    expires_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
