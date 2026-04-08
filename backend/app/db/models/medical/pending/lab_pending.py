import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class LabPending(SQLModel, table=True):
    __tablename__ = "lab_pending"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    hospital_id: uuid.UUID

    test_name: str
    body_part: Optional[str] = None
    reason: Optional[str] = None

    result_text: Optional[str] = None
    notes: Optional[str] = None

    test_date: datetime

    status: str = "pending"
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    decline_reason: Optional[str] = None
    revision_count: int = 0
    expires_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
