from sqlmodel import Field, SQLModel
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from ..base import SQLModelBase

from sqlalchemy import UniqueConstraint, Column, DateTime

from app.core.time import utcnow

class PatientAccessSession(SQLModel, table=True):

    __tablename__ = "patientaccesssession"

    __table_args__ = (
        UniqueConstraint("doctor_id", "patient_id", name="unique_access_session"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    doctor_id: UUID = Field(index=True)
    hospital_id: UUID = Field(index=True)
    patient_id: UUID = Field(index=True)

    view_expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))

    entry_expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))

    created_at: datetime = Field(default_factory=utcnow,sa_column=Column(DateTime(timezone=True), nullable=False))

    last_accessed_at: datetime = Field(default_factory=utcnow,sa_column=Column(DateTime(timezone=True), nullable=False))
