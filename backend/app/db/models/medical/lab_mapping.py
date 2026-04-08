from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid


class LabMapping(SQLModel, table=True):
    __tablename__ = "lab_mappings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    lab_id: uuid.UUID = Field(foreign_key="lab_results.id")

    entry_type: str
    entry_id: uuid.UUID

    created_at: datetime = Field(default_factory=datetime.utcnow)
