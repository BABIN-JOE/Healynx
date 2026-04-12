from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Surgery(SQLModel, table=True):
    __tablename__ = "surgeries"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID = Field(foreign_key="patient.id")
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id")
    hospital_id: uuid.UUID = Field(foreign_key="hospital.id")

    # Followup reference
    parent_surgery_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="surgeries.id"
    )

    # Surgery details
    surgery_name: str
    body_part: Optional[str] = None
    reason: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None

    # Dates
    surgery_date: Optional[datetime] = None
    admit_date: Optional[datetime] = None
    discharge_date: Optional[datetime] = None

    # Followup condition
    followup_condition: Optional[str] = None

    # Medication
    medication_name: Optional[str] = None
    medication_start_date: Optional[datetime] = None
    medication_end_date: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
