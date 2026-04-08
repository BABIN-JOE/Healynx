from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class LabResult(SQLModel, table=True):
    __tablename__ = "lab_results"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    patient_id: uuid.UUID = Field(foreign_key="patient.id")
    doctor_id: uuid.UUID = Field(foreign_key="doctor.id")
    hospital_id: uuid.UUID = Field(foreign_key="hospital.id")

    test_name: str
    body_part: Optional[str] = None
    reason: Optional[str] = None

    result_text: Optional[str] = None
    notes: Optional[str] = None

    test_date: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
