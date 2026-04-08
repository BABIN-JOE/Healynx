from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Visit(SQLModel, table=True):
    __tablename__ = "visits"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID = Field(foreign_key="patient.id")
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id")
    hospital_id: uuid.UUID = Field(foreign_key="hospital.id")

    # Followup reference
    parent_visit_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="visits.id"
    )

    visit_date: datetime = Field(default_factory=datetime.utcnow)

    # Visit details
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None

    # Followup specific
    followup_condition: Optional[str] = None

    # Medication
    medication_name: Optional[str] = None
    medication_start_date: Optional[datetime] = None
    medication_end_date: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
