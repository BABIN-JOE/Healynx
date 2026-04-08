from sqlmodel import Field
from uuid import UUID, uuid4
from typing import Optional
from datetime import datetime

from .base import SQLModelBase


class Attachment(SQLModelBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    parent_id: Optional[UUID] = None
    parent_type: Optional[str] = None  # surgery, medication, lab, etc.

    filename: str
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None

    minio_key: str

    created_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_by: Optional[UUID] = None
