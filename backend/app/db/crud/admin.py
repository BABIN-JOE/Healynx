from app.core.time import utcnow
from sqlmodel import Session, select
from uuid import UUID
from typing import Optional
from datetime import datetime
import uuid
import json

from app.db import models
from app.core import crypto


def create_admin(
    session: Session,
    *,
    first_name: str,
    middle_name: Optional[str] = None,
    last_name: str,
    gender: str,
    dob: str,
    aadhaar_hash: str,
    aadhaar_encrypted: bytes,
    phone_encrypted: Optional[bytes] = None,
    email_encrypted: Optional[bytes] = None,
    address_obj: Optional[dict] = None,
    address_encrypted: Optional[bytes] = None,
    username: str,
    password_hash: str,
    created_by: str
):

    addr_blob = None
    if address_obj is not None:
        addr_blob = crypto.aesgcm_encrypt_str(json.dumps(address_obj))
    elif address_encrypted is not None:
        addr_blob = address_encrypted

    admin = models.Admin(
        id=uuid.uuid4(),
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        gender=gender,
        dob=dob,
        aadhaar_hash=aadhaar_hash,
        aadhaar_encrypted=aadhaar_encrypted,
        phone_encrypted=phone_encrypted,
        email_encrypted=email_encrypted,
        address_encrypted=addr_blob,
        username=username,
        password_hash=password_hash,
        created_by=created_by,
        created_at=utcnow(),
        is_active=True,
        is_blocked=False
    )

    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


def get_admin_by_username(session: Session, username: str):
    q = select(models.Admin).where(models.Admin.username == username)
    return session.exec(q).first()


def get_admin(session: Session, admin_id: UUID):
    return session.get(models.Admin, admin_id)


def get_admin_by_aadhaar_hash(session: Session, h: str):
    q = select(models.Admin).where(models.Admin.aadhaar_hash == h)
    return session.exec(q).first()


def get_admin_by_phone_hash(session: Session, phone_hash: str):
    q = select(models.Admin).where(models.Admin.phone_hash == phone_hash)
    return session.exec(q).first()


def get_admin_by_email_hash(session: Session, email_hash: str):
    q = select(models.Admin).where(models.Admin.email_hash == email_hash)
    return session.exec(q).first()
