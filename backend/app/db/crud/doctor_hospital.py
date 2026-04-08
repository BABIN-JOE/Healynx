from app.core.time import utcnow
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlmodel import Session, select

from app.db import models


# ---------------------------------------------------------
# Hospital Approves Doctor Join Request
# ---------------------------------------------------------

def hospital_approve_doctor_request(
    session: Session,
    dr_id,
    hospital_id,
    approved_by_hospital_id
):
    req = session.get(models.DoctorRequest, dr_id)
    if not req:
        return None

    if str(req.hospital_id) != str(hospital_id):
        return None

    if req.status != "hospital_pending":
        return None

    doctor = session.exec(
        select(models.Doctor).where(
            models.Doctor.license_number == req.license_number
        )
    ).first()

    # Create doctor if not existing
    if not doctor:
        doctor = models.Doctor(
            first_name=req.first_name,
            middle_name=req.middle_name,
            last_name=req.last_name,
            dob=req.dob,
            gender=req.gender,
            specialization=req.specialization,
            aadhaar_encrypted=req.aadhaar_encrypted,
            aadhaar_hash=req.aadhaar_hash,
            license_number=req.license_number,
            phone_encrypted=req.phone_encrypted,
            email_encrypted=req.email_encrypted,
            address_encrypted=req.address_encrypted,
            created_by=approved_by_hospital_id,
            password_hash=req.password_hash
        )
        session.add(doctor)
        session.flush()

    # Enforce one active hospital per doctor
    existing_map = session.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor.id,
            models.HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if existing_map:
        return None

    mapping = models.HospitalDoctorMap(
        hospital_id=hospital_id,
        doctor_id=doctor.id
    )

    session.add(mapping)

    req.status = "approved"
    req.reviewed_by = approved_by_hospital_id
    req.reviewed_at = utcnow()

    session.commit()
    session.refresh(doctor)

    return doctor


# ---------------------------------------------------------
# Hospital Rejects Doctor Join Request
# ---------------------------------------------------------

def hospital_reject_doctor_request(
    session: Session,
    dr_id,
    hospital_id,
    reviewed_by_hospital_id,
    reason: Optional[str] = None
):
    req = session.get(models.DoctorRequest, dr_id)
    if not req:
        return None

    if str(req.hospital_id) != str(hospital_id):
        return None

    if req.status != "hospital_pending":
        return None

    req.status = "hospital_rejected"
    req.reviewed_by = reviewed_by_hospital_id
    req.reviewed_at = utcnow()

    extra = req.extra or {}
    if reason:
        extra["rejection_reason"] = reason
        req.extra = extra

    session.commit()
    return req


# HospitalDoctorMap helpers
def create_hospital_doctor_map(session: Session, hospital_id: UUID, doctor_id: UUID, role: Optional[str] = "doctor", phone_encrypted: Optional[bytes] = None, email_encrypted: Optional[bytes] = None, address_encrypted: Optional[bytes] = None):
    m = models.HospitalDoctorMap(
        hospital_id=hospital_id,
        doctor_id=doctor_id,
        role=role,
        phone_encrypted=phone_encrypted,
        email_encrypted=email_encrypted,
        address_encrypted=address_encrypted
    )
    session.add(m)
    session.commit()
    session.refresh(m)
    return m

def get_hospital_doctor_map(session: Session, hospital_id: UUID, doctor_id: UUID):
    q = select(models.HospitalDoctorMap).where(models.HospitalDoctorMap.hospital_id == hospital_id, models.HospitalDoctorMap.doctor_id == doctor_id)
    return session.exec(q).first()
