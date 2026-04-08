from app.core.time import *
from typing import Optional
from sqlmodel import Session, select, delete

from app.db import models


# ---------------------------------------------------
# CREATE REQUEST
# ---------------------------------------------------
def create_patient_access_request(
    session: Session,
    doctor_id,
    hospital_id,
    patient_aadhaar_hash,
    extra: Optional[dict] = None
):
    # ---------------------------------------------------
    # CLEANUP OLD REQUESTS (CRITICAL FIX)
    # ---------------------------------------------------
    old_requests = session.exec(
        select(models.PatientAccessRequest).where(
            models.PatientAccessRequest.doctor_id == doctor_id,
            models.PatientAccessRequest.patient_aadhaar_hash == patient_aadhaar_hash,
            models.PatientAccessRequest.hospital_id == hospital_id
        )
    ).all()

    for req in old_requests:
        if is_expired(req.expires_at) or req.status in ["expired", "declined"]:
            session.delete(req)

    # ---------------------------------------------------
    # CLEANUP OLD SESSIONS
    # ---------------------------------------------------
    old_sessions = session.exec(
        select(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == doctor_id,
            models.PatientAccessSession.hospital_id == hospital_id
        )
    ).all()

    for s in old_sessions:
        if is_expired(s.view_expires_at) and is_expired(s.entry_expires_at):
            session.delete(s)

    session.commit()

    # ---------------------------------------------------
    # CREATE NEW REQUEST
    # ---------------------------------------------------
    req = models.PatientAccessRequest(
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        patient_aadhaar_hash=patient_aadhaar_hash,
        expires_at=request_expiry_time(),
        extra=extra or {}
    )

    session.add(req)
    session.commit()
    session.refresh(req)

    return req


# ---------------------------------------------------
# GET SINGLE REQUEST
# ---------------------------------------------------

def get_patient_access_request(session: Session, req_id):
    return session.get(models.PatientAccessRequest, req_id)


# ---------------------------------------------------
# HOSPITAL LISTS PENDING REQUESTS
# ---------------------------------------------------
def list_pending_patient_access_requests_for_hospital(
    session: Session,
    hospital_id
):

    now = utcnow()

    q = (
        select(
            models.PatientAccessRequest,
            models.Doctor,
            models.Patient
        )
        .join(
            models.Doctor,
            models.Doctor.id == models.PatientAccessRequest.doctor_id
        )
        .join(
            models.Patient,
            models.Patient.aadhaar_hash ==
            models.PatientAccessRequest.patient_aadhaar_hash,
            isouter=True
        )
        .where(
            models.PatientAccessRequest.hospital_id == hospital_id,
            models.PatientAccessRequest.status == "pending"
        )
    )

    rows = session.exec(q).all()
    results = []

    for req, doctor, patient in rows:

        expires_at = req.expires_at

        # auto-expire requests
        if is_expired(req.expires_at):
            req.status = "expired"
            session.add(req)
            session.commit()
            continue

        results.append({
            "id": req.id,
            "doctor_id": req.doctor_id,
            "doctor_name": f"{doctor.first_name} {doctor.last_name}",
            "patient_name": (
                f"{patient.first_name} {patient.last_name}"
                if patient else "Unknown Patient"
            ),
            "patient_aadhaar_hash": req.patient_aadhaar_hash,
            "status": req.status,
            "expires_at": expires_at,
            "can_act": True
        })

    return results


# ---------------------------------------------------
# APPROVE ACCESS REQUEST
# ---------------------------------------------------
def approve_patient_access_request(
    session: Session,
    req_id,
    reviewed_by
):

    req = session.get(models.PatientAccessRequest, req_id)

    if not req:
        return None

    now = utcnow()

    if is_expired(req.expires_at):
        req.status = "expired"
        session.add(req)
        session.commit()
        return None

    req.status = "approved"
    req.reviewed_by = reviewed_by
    req.reviewed_at = now

    session.add(req)
    session.commit()
    session.refresh(req)

    # ---------------------------------------------------
    # Get patient
    # ---------------------------------------------------

    patient = session.exec(
        select(models.Patient).where(
            models.Patient.aadhaar_hash == req.patient_aadhaar_hash
        )
    ).first()

    if not patient:
        return req

    # ---------------------------------------------------
    # ALWAYS RESET SESSION (NO REUSE)
    # ---------------------------------------------------

    session.exec(
        delete(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == req.doctor_id,
            models.PatientAccessSession.patient_id == patient.id,
            models.PatientAccessSession.hospital_id == req.hospital_id
        )
    )

    view_expiry = session_expiry_time()
    entry_expiry = entry_expiry_time()

    new_session = models.PatientAccessSession(
        doctor_id=req.doctor_id,
        hospital_id=req.hospital_id,
        patient_id=patient.id,
        view_expires_at=view_expiry,
        entry_expires_at=entry_expiry,
        created_at=now,
        last_accessed_at=now
    )

    session.add(new_session)
    session.commit()

    return req


# ---------------------------------------------------
# RESET ACCESS SESSION (ONLY WHEN EXPLICITLY NEEDED)
# ---------------------------------------------------
def reset_doctor_access_window(
    session: Session,
    doctor_id,
    patient_id
):

    now = utcnow()

    session_obj = session.exec(
        select(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == doctor_id,
            models.PatientAccessSession.patient_id == patient_id
        )
    ).first()

    if not session_obj:
        return None

    if is_expired(session_obj.view_expires_at):
        return None

    session_obj.view_expires_at = session_expiry_time()
    session_obj.entry_expires_at = entry_expiry_time()
    session_obj.last_accessed_at = now

    session.add(session_obj)
    session.commit()
    session.refresh(session_obj)

    return session_obj


# ---------------------------------------------------
# DECLINE REQUEST
# ---------------------------------------------------
def decline_patient_access_request(
    session: Session,
    req_id,
    reviewed_by,
    reason: Optional[str] = None
):

    req = session.get(models.PatientAccessRequest, req_id)

    if not req:
        return None

    now = utcnow()

    expires_at = req.expires_at

    if is_expired(req.expires_at):
        req.status = "expired"
        session.commit()
        return None

    req.status = "declined"
    req.reviewed_by = reviewed_by
    req.reviewed_at = now

    if reason:
        extra = req.extra or {}
        extra["decline_reason"] = reason
        req.extra = extra

    session.add(req)
    session.commit()
    session.refresh(req)

    return req


# ---------------------------------------------------
# CLEANUP EXPIRED SESSIONS
# ---------------------------------------------------
def cleanup_expired_access_sessions(session: Session):

    sessions = session.exec(select(models.PatientAccessSession)).all()

    for s in sessions:
        if is_expired(s.view_expires_at) and is_expired(s.entry_expires_at):
            session.delete(s)

    session.commit()