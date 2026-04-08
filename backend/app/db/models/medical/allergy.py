from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Allergy(SQLModel, table=True):
    __tablename__ = "allergies"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID = Field(foreign_key="patient.id")
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id")
    hospital_id: uuid.UUID = Field(foreign_key="hospital.id")

    # Followup reference
    parent_allergy_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="allergies.id"
    )

    allergy_type: Optional[str] = None
    body_location: Optional[str] = None
    severity: Optional[str] = None

    first_noted_date: Optional[datetime] = None

    diagnosis: Optional[str] = None
    notes: Optional[str] = None

    # Followup condition
    followup_condition: Optional[str] = None

    # Medication
    medication_name: Optional[str] = None
    medication_start_date: Optional[datetime] = None
    medication_end_date: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
