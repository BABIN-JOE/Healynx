from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Immunization(SQLModel, table=True):
    __tablename__ = "immunizations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID = Field(foreign_key="patient.id")
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id")
    hospital_id: uuid.UUID = Field(foreign_key="hospital.id")

    vaccine_name: str
    reason: Optional[str] = None
    dosage: Optional[str] = None

    vaccination_date: datetime

    notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
