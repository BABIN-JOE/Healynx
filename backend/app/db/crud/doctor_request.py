from app.core.time import utcnow
from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlmodel import Session, select
import json

from app.db import models
from app.core import crypto


# ---------------------------------------------------------
# Doctor Join / Registration Requests
# ---------------------------------------------------------

def create_doctor_request(
    session: Session,
    first_name: str,
    last_name: str,
    specialization: str,
    middle_name: Optional[str] = None,
    dob: Optional[str] = None,
    gender: Optional[str] = None,
    aadhaar_encrypted: Optional[bytes] = None,
    aadhaar_hash: Optional[str] = None,
    license_number: Optional[str] = None,
    phone_encrypted: Optional[bytes] = None,
    email_encrypted: Optional[bytes] = None,
    address_obj: Optional[dict] = None,
    address_encrypted: Optional[bytes] = None,
    password_hash: Optional[str] = None,
    hospital_id: Optional[UUID] = None,
    status: str = "hospital_pending",
    **kwargs
):
    """
    Create a doctor join request.
    """

    if not specialization:
        raise ValueError("Doctor specialization is required")

    addr_blob = None
    if address_obj is not None:
        addr_blob = crypto.aesgcm_encrypt_str(json.dumps(address_obj))
    elif address_encrypted is not None:
        addr_blob = address_encrypted

    obj = models.DoctorRequest(
        hospital_id=hospital_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        dob=dob,
        gender=gender,
        specialization=specialization,
        aadhaar_encrypted=aadhaar_encrypted,
        aadhaar_hash=aadhaar_hash,
        license_number=license_number,
        phone_encrypted=phone_encrypted,
        email_encrypted=email_encrypted,
        address_encrypted=addr_blob,
        password_hash=password_hash,
        status=status,
        **kwargs
    )

    session.add(obj)
    session.commit()
    session.refresh(obj)

    return obj


def get_doctor_request(session: Session, dr_id):
    return session.get(models.DoctorRequest, dr_id)


def get_doctor_request_by_id(session: Session, req_id: str):
    return session.get(models.DoctorRequest, req_id)


def list_doctor_requests(session: Session, status: Optional[str] = None):
    q = select(models.DoctorRequest)
    if status:
        q = q.where(models.DoctorRequest.status == status)
    return session.exec(q).all()


# ---------------------------------------------------------
# Admin Approves Self-Registered Doctor
# ---------------------------------------------------------

def approve_doctor_request(
    session: Session,
    dr_id,
    approved_by_admin_id
):
    """
    Admin approval for self-registered doctors only.
    """

    req = session.get(models.DoctorRequest, dr_id)
    if not req or req.status != "pending":
        return None

    existing = session.exec(
        select(models.Doctor).where(
            models.Doctor.license_number == req.license_number
        )
    ).first()

    if existing:
        doctor = existing
    else:
        doctor = models.Doctor(
            first_name=req.first_name,
            middle_name=req.middle_name,
            last_name=req.last_name,
            gender=req.gender,
            dob=req.dob,
            specialization=req.specialization,
            aadhaar_encrypted=req.aadhaar_encrypted,
            aadhaar_hash=req.aadhaar_hash,
            license_number=req.license_number,
            phone_encrypted=req.phone_encrypted,
            email_encrypted=req.email_encrypted,
            address_encrypted=req.address_encrypted,
            created_by=approved_by_admin_id,
            password_hash=req.password_hash
        )

        doctor.approved_by = approved_by_admin_id
        doctor.approved_at = utcnow()

        session.add(doctor)
        session.flush()

    req.status = "approved"
    req.reviewed_by = approved_by_admin_id
    req.reviewed_at = utcnow()

    session.commit()
    session.refresh(doctor)

    return doctor


def reject_doctor_request(
    session: Session,
    dr_id,
    reviewed_by_admin_id,
    reason: Optional[str] = None
):
    req = session.get(models.DoctorRequest, dr_id)
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
