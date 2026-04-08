from sqlmodel import Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

from .base import SQLModelBase
from app.core.time import utcnow


class RefreshToken(SQLModelBase, table=True):

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: Optional[UUID] = Field(default=None, index=True)
    doctor_id: Optional[UUID] = Field(default=None, index=True)
    hospital_id: Optional[UUID] = Field(default=None, index=True)
    session_id: str

    user_agent: Optional[str] = Field(default=None)
    ip_address: Optional[str] = Field(default=None)

    token_hash: str = Field(index=True, unique=True)

    role : str
    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime

    revoked: bool = Field(default=False)