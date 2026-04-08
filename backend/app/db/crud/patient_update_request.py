from sqlmodel import Session, select
from app.db import models
from app.core import crypto
from app.core.time import utcnow, ensure_utc


# -------------------------------------------------------------------
# CREATE
# -------------------------------------------------------------------
def create_patient_update_request(
    session: Session,
    patient_id,
    doctor_id,
    hospital_id,
    changes: dict,
):
    obj = models.PatientUpdateRequest(
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        requested_changes=changes,
    )

    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


# -------------------------------------------------------------------
# LIST
# -------------------------------------------------------------------
def list_pending_update_requests(session: Session, hospital_id):
    now = utcnow()

    rows = session.exec(
        select(models.PatientUpdateRequest).where(
            models.PatientUpdateRequest.hospital_id == hospital_id,
            models.PatientUpdateRequest.status == "pending"
        )
    ).all()

    result = []

    for r in rows:
        expires_at = ensure_utc(r.expires_at)

        if expires_at and expires_at <= now:
            r.status = "expired"
            session.add(r)
            session.commit()
            continue

        result.append(r)

    return result


# -------------------------------------------------------------------
# APPROVE
# -------------------------------------------------------------------
def approve_patient_update_request(session: Session, req_id, hospital_id):
    req = session.get(models.PatientUpdateRequest, req_id)

    if not req or req.status != "pending":
        return None

    # ✅ FIXED
    expires_at = ensure_utc(req.expires_at)

    if expires_at and expires_at <= utcnow():
        req.status = "expired"
        session.add(req)
        session.commit()
        return None

    patient = session.get(models.Patient, req.patient_id)
    if not patient:
        return None

    changes = req.requested_changes or {}

    allowed_fields = {"phone", "emergency_contact", "blood_group"}

    # Filter invalid fields
    for key in list(changes.keys()):
        if key not in allowed_fields:
            changes.pop(key)

    phone = changes.get("phone")
    emergency = changes.get("emergency_contact")

    if phone and emergency and phone == emergency:
        raise ValueError("Phone and emergency contact cannot be same")

    # -------------------------
    # APPLY CHANGES
    # -------------------------
    if "phone" in changes:
        patient.phone_encrypted = crypto.aesgcm_encrypt_str(
            changes["phone"]
        )

    if "emergency_contact" in changes:
        patient.emergency_contact_encrypted = crypto.aesgcm_encrypt_str(
            changes["emergency_contact"]
        )

    if "blood_group" in changes:
        patient.blood_group = changes["blood_group"]

    # -------------------------
    # UPDATE REQUEST
    # -------------------------
    req.status = "approved"
    req.reviewed_by = hospital_id
    req.reviewed_at = utcnow()

    session.add(patient)
    session.add(req)
    session.commit()

    return req


# -------------------------------------------------------------------
# DECLINE
# -------------------------------------------------------------------
def decline_patient_update_request(session: Session, req_id, hospital_id):
    req = session.get(models.PatientUpdateRequest, req_id)

    if not req or req.status != "pending":
        return None

    expires_at = ensure_utc(req.expires_at)

    if expires_at and expires_at <= utcnow():
        req.status = "expired"
        session.add(req)
        session.commit()
        return None

    req.status = "declined"
    req.reviewed_by = hospital_id
    req.reviewed_at = utcnow()

    session.add(req)
    session.commit()

    return req