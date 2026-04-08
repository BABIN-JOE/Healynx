from app.core.time import utcnow
from sqlmodel import Session, select
from typing import Optional
from uuid import UUID
from datetime import datetime
import json

from app.db import models
from app.core import crypto


# ---------------------------------------------------------
# Hospital Registration Requests
# ---------------------------------------------------------

def create_hospital_request(
    session: Session,
    hospital_name: str,
    license_number: str,
    owner_first_name: str,
    owner_last_name: str,
    owner_middle_name: Optional[str] = None,
    owner_aadhaar_encrypted: bytes = None,
    owner_aadhaar_hash: str = None,
    phone_encrypted: Optional[bytes] = None,
    email_encrypted: Optional[bytes] = None,
    address_obj: Optional[dict] = None,
    address_encrypted: Optional[bytes] = None,
    password_hash: Optional[str] = None,
    **kwargs
):
    addr_blob = None
    if address_obj is not None:
        addr_blob = crypto.aesgcm_encrypt_str(json.dumps(address_obj))
    elif address_encrypted is not None:
        addr_blob = address_encrypted

    obj = models.HospitalRequest(
        hospital_name=hospital_name,
        license_number=license_number,
        owner_first_name=owner_first_name,
        owner_middle_name=owner_middle_name,
        owner_last_name=owner_last_name,
        owner_aadhaar_encrypted=owner_aadhaar_encrypted,
        owner_aadhaar_hash=owner_aadhaar_hash,
        phone_encrypted=phone_encrypted,
        email_encrypted=email_encrypted,
        address_encrypted=addr_blob,
        password_hash=password_hash,
        **kwargs
    )

    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def get_hospital_request(session: Session, request_id):
    return session.get(models.HospitalRequest, request_id)


def list_hospital_requests(session: Session, status: Optional[str] = None):
    q = select(models.HospitalRequest)
    if status:
        q = q.where(models.HospitalRequest.status == status)
    return session.exec(q).all()


def approve_hospital_request(session: Session, request_id, approved_by_admin_id):
    req = session.get(models.HospitalRequest, request_id)
    if not req or req.status != "pending":
        return None

    hospital = models.Hospital(
        hospital_name=req.hospital_name,
        license_number=req.license_number,
        owner_first_name=req.owner_first_name,
        owner_middle_name=getattr(req, "owner_middle_name", None),
        owner_last_name=req.owner_last_name,
        owner_aadhaar_encrypted=req.owner_aadhaar_encrypted,
        owner_aadhaar_hash=req.owner_aadhaar_hash,
        phone_encrypted=req.phone_encrypted,
        email_encrypted=req.email_encrypted,
        address_encrypted=req.address_encrypted,
        created_by=approved_by_admin_id,
        password_hash=getattr(req, "password_hash", None)
    )

    hospital.approved_by = approved_by_admin_id
    hospital.approved_at = utcnow()

    session.add(hospital)

    req.status = "approved"
    req.reviewed_by = approved_by_admin_id
    req.reviewed_at = utcnow()

    session.commit()
    session.refresh(hospital)

    return hospital


def reject_hospital_request(
    session: Session,
    request_id,
    reviewed_by_admin_id,
    reason: Optional[str] = None
):
    req = session.get(models.HospitalRequest, request_id)
    if not req or req.status != "pending":
        return None

    req.status = "rejected"
    req.reviewed_by = reviewed_by_admin_id
    req.reviewed_at = utcnow()

    extra = req.extra or {}
    if reason:
        extra["rejection_reason"] = reason
        req.extra = extra

    session.commit()
    return req


# ---------------------------------------------------------
# Hospitals
# ---------------------------------------------------------

def get_hospital(session: Session, hospital_id: UUID):
    return session.get(models.Hospital, hospital_id)


def get_hospital_by_license(session: Session, license_number: str):
    q = select(models.Hospital).where(
        models.Hospital.license_number == license_number
    )
    return session.exec(q).first()


def list_hospitals(session: Session, active_only: bool = True):
    q = select(models.Hospital)
    if active_only:
        q = q.where(models.Hospital.is_active == True)
    return session.exec(q).all()


def soft_delete_hospital(session: Session, hospital_id: UUID):
    h = session.get(models.Hospital, hospital_id)
    if not h:
        return None

    h.is_active = False
    session.add(h)
    session.commit()
    session.refresh(h)
    return h


def delete_hospital_permanently(session: Session, hospital_id: UUID):
    h = session.get(models.Hospital, hospital_id)
    if not h:
        return None

    session.delete(h)
    session.commit()
    return True
