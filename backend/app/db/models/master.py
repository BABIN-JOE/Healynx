from sqlmodel import Field
from uuid import UUID, uuid4
from datetime import datetime

from .base import SQLModelBase


class Master(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    username: str = Field(index=True, unique=True)
    password_hash: str

    created_at: datetime = Field(default_factory=datetime.utcnow)
