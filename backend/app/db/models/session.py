# app/db/models/session.py

from sqlmodel import Field
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime

from .base import SQLModelBase
from app.core.time import utcnow


class Session(SQLModelBase, table=True):

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    role: str
    csrf_token: Optional[str] = None
    last_active: datetime = Field(default_factory=utcnow)

    user_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    hospital_id: Optional[UUID] = None

    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime

    revoked: bool = Field(default=False)

    user_agent: Optional[str] = None
    ip_address: Optional[str] = None