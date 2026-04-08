from sqlmodel import Field, Column
from uuid import UUID
from typing import Optional
from datetime import datetime
from sqlalchemy import JSON

from .base import SQLModelBase


class AuditLog(SQLModelBase, table=True):
    id: int = Field(default=None, primary_key=True)

    action_type: str
    user_role: str

    user_id: Optional[UUID] = None
    hospital_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None

    target_entity: Optional[str] = None
    target_entity_id: Optional[UUID] = None

    timestamp: datetime = Field(default_factory=datetime.utcnow)

    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    changed_fields: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    extra: Optional[dict] = Field(default=None, sa_column=Column(JSON))
