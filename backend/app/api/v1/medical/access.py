from app.core.time import *
from fastapi import APIRouter, Depends, HTTPException, Request, Body
from sqlmodel import Session, select

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud, models
from app.core import crypto
from app.core.audit import log_action

router = APIRouter(tags=["Medical - Access"])


# -------------------------------------------------------------------
# 1) Doctor requests access to patient records by providing Aadhaar
# -------------------------------------------------------------------
@router.post("/access-request")
def request_patient_access(
    aadhaar: str = Body(..., embed=True),
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 

    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    # ------------------------------------------------
    # Verify doctor ↔ hospital mapping
    # ------------------------------------------------

    mapping = db.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            models.HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if not mapping:
        raise HTTPException(
            403,
            "Doctor not mapped to any hospital, Join a Hospital to access the Patient Records"
        )

    aadhaar_hash = crypto.aadhaar_hash_hex(aadhaar)

    # ------------------------------------------------
    # Validate patient exists
    # ------------------------------------------------

    patient = db.exec(
        select(models.Patient).where(
            models.Patient.aadhaar_hash == aadhaar_hash,
            models.Patient.is_active == True
        )
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Invalid Aadhaar number or patient does not exist"
        )

    now = utcnow()

    # ------------------------------------------------
    # ✅ CHECK ACTIVE SESSION (SOURCE OF TRUTH)
    # ------------------------------------------------

    existing_session = db.exec(
        select(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == doctor_id,
            models.PatientAccessSession.patient_id == patient.id
        )
    ).first()

    if existing_session:
        view_expiry = ensure_utc(existing_session.view_expires_at)

        if view_expiry and not is_expired(view_expiry):
            return {
                "message": "Access already active",
                "view_expires_in": seconds_remaining(view_expiry),
                "entry_expires_in": seconds_remaining(existing_session.entry_expires_at)
            }

        # ❗ cleanup expired session
        db.delete(existing_session)
        db.commit()

    # ------------------------------------------------
    # ❌ REMOVE BROKEN APPROVED CHECK (IMPORTANT)
    # ------------------------------------------------
    # We DO NOT rely on PatientAccessRequest anymore for validity

    # ------------------------------------------------
    # CHECK PENDING REQUEST
    # ------------------------------------------------

    existing_pending = db.exec(
        select(models.PatientAccessRequest).where(
            models.PatientAccessRequest.doctor_id == doctor_id,
            models.PatientAccessRequest.hospital_id == mapping.hospital_id,
            models.PatientAccessRequest.patient_aadhaar_hash == aadhaar_hash,
            models.PatientAccessRequest.status == "pending"
        )
    ).first()

    if existing_pending:
        expires_at = ensure_utc(existing_pending.expires_at)

        if expires_at and not is_expired(expires_at):
            return {
                "message": "Access request already pending",
                "request_id": str(existing_pending.id),
                "expires_in": seconds_remaining(expires_at)
            }

        # ❗ cleanup expired pending request
        existing_pending.status = "expired"
        db.add(existing_pending)
        db.commit()

    # ------------------------------------------------
    # CREATE NEW REQUEST
    # ------------------------------------------------

    req = crud.create_patient_access_request(
        db,
        doctor_id,
        mapping.hospital_id,
        aadhaar_hash,
    )

    log_action(
        db,
        action_type="doctor.request_patient_access",
        user_role="doctor",
        user_id=doctor_id,
        target_entity="patient_access_requests",
        target_entity_id=req.id
    )

    return {
        "request_id": str(req.id),
        "expires_in": seconds_remaining(req.expires_at)
    }


# -------------------------------------------------------------------
# 2) Hospital lists pending patient access requests (NO DUPLICATES)
# -------------------------------------------------------------------

def list_pending_patient_access_requests_for_hospital(
    session: Session,
    hospital_id
):

    now = utcnow()

    q = (
        select(models.PatientAccessRequest)
        .where(
            models.PatientAccessRequest.hospital_id == hospital_id,
            models.PatientAccessRequest.status == "pending"
        )
        .order_by(models.PatientAccessRequest.created_at.desc())
    )

    rows = session.exec(q).all()

    latest_per_patient = {}
    results = []

    for req in rows:

        key = (req.doctor_id, req.patient_aadhaar_hash)

        # keep newest request only
        if key in latest_per_patient:
            continue

        latest_per_patient[key] = True

        # expire request automatically
        if req.expires_at and req.expires_at <= now:
            req.status = "expired"
            session.add(req)
            session.commit()
            continue

        doctor = session.get(models.Doctor, req.doctor_id)

        patient = session.exec(
            select(models.Patient).where(
                models.Patient.aadhaar_hash == req.patient_aadhaar_hash
            )
        ).first()

        results.append({
            "id": req.id,
            "doctor_id": req.doctor_id,
            "doctor_name": (
                f"{doctor.first_name} {doctor.last_name}"
                if doctor else "—"
            ),
            "patient_name": (
                f"{patient.first_name} {patient.last_name}"
                if patient else "—"
            ),
            "patient_aadhaar_hash": req.patient_aadhaar_hash,
            "status": req.status,
            "expires_at": req.expires_at,
            "can_act": True,
        })

    return results


# -------------------------------------------------------------------
# 3) Hospital approves access request
# -------------------------------------------------------------------
@router.post("/access-requests/{req_id}/approve")
def approve_access_request(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None
):
    verify_csrf(request, db) 

    hospital_id = payload.get("hospital_id")

    approved = crud.approve_patient_access_request(
        db,
        req_id,
        reviewed_by=hospital_id
    )

    if not approved:
        raise HTTPException(
            status_code=400,
            detail="Unable to approve (not found or expired)"
        )

    # -----------------------------------------
    # Extract entry expiry from JSON extra
    # -----------------------------------------
    entry_expires_at = None

    if approved.extra and "entry_expires_at" in approved.extra:
        entry_expires_at = approved.extra.get("entry_expires_at")

    log_action(
        db,
        action_type="hospital.approve_access_request",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="patient_access_requests",
        target_entity_id=approved.id,
        ip=request.client.host if request else None
    )

    # fetch the created access session
    session_obj = db.exec(
        select(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == approved.doctor_id,
            models.PatientAccessSession.hospital_id == hospital_id
        )
    ).first()

    return {
        "message": "Access approved",
        "request_id": str(approved.id),
        "reviewed_at": approved.reviewed_at,
        "view_expires_in": seconds_remaining(session_obj.view_expires_at),
        "entry_expires_in": seconds_remaining(session_obj.entry_expires_at),
    }

# -------------------------------------------------------------------
# 4) Hospital declines access request
# -------------------------------------------------------------------
@router.post("/access-requests/{req_id}/decline")
def decline_access_request(
    req_id: str,
    reason: str = Body(None),
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None
):
    verify_csrf(request, db) 

    hospital_id = payload.get("hospital_id")

    res = crud.decline_patient_access_request(
        db,
        req_id,
        reviewed_by=hospital_id,
        reason=reason
    )

    if not res:
        raise HTTPException(
            status_code=400,
            detail="Unable to decline (not found or expired)"
        )

    log_action(
        db,
        action_type="hospital.decline_access_request",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="patient_access_requests",
        target_entity_id=res.id,
        ip=request.client.host if request else None
    )

    return {"message": "Access declined"}


# -------------------------------------------------------------------
# 5) Doctor checks request status
# -------------------------------------------------------------------
@router.get("/access-requests/{req_id}/status")
def check_access_request(
    req_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db)
):

    req = crud.get_patient_access_request(db, req_id)

    if not req:
        raise HTTPException(404, "Request not found")

    now = utcnow()

    if req.status == "pending" and is_expired(req.expires_at):

        req.status = "expired"
        db.add(req)
        db.commit()

        return {"status": "expired"}

    return {
        "status": req.status,
        "approved_by": req.reviewed_by,
        "reviewed_at": req.reviewed_at
    }

# -------------------------------------------------------------------
# 6) Doctor sees approved patients (ACTIVE VIEW ACCESS)
# -------------------------------------------------------------------
@router.get("/my-approved-patient-access")
def list_my_approved_patient_access(
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db)
):

    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    now = utcnow()

    rows = db.exec(
        select(
            models.PatientAccessSession,
            models.Patient
        )
        .join(
            models.Patient,
            models.Patient.id == models.PatientAccessSession.patient_id
        )
        .where(
            models.PatientAccessSession.doctor_id == doctor_id
        )
        .order_by(models.PatientAccessSession.view_expires_at.asc())
    ).all()

    result = []

    for session_obj, patient in rows:

        view_expiry = ensure_utc(session_obj.view_expires_at)
        entry_expiry = ensure_utc(session_obj.entry_expires_at)

        if not view_expiry or is_expired(view_expiry):

            # cleanup expired sessions
            db.delete(session_obj)
            db.commit()

            continue

        full_name = " ".join(
            filter(None, [
                patient.first_name,
                patient.middle_name,
                patient.last_name
            ])
        )

        remaining_seconds = seconds_remaining(view_expiry)

        result.append({
            "patient_id": str(patient.id),
            "patient_name": full_name,
            "view_expires_in": seconds_remaining(view_expiry),
            "entry_expires_in": seconds_remaining(entry_expiry),
        })

    return result

@router.get("/patient/{patient_id}")
def get_patient_details(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):

    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    now = utcnow()

    session_obj = db.exec(
        select(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == doctor_id,
            models.PatientAccessSession.patient_id == patient_id,
        )
    ).first()

    if not session_obj or is_expired(session_obj.view_expires_at):
        raise HTTPException(403, "No active access to this patient")

    patient = db.get(models.Patient, patient_id)

    if not patient:
        raise HTTPException(404, "Patient not found")

    return {
        "id": patient.id,
        "full_name": " ".join(
            filter(None, [
                patient.first_name,
                patient.middle_name,
                patient.last_name
            ])
        ),
        "gender": patient.gender,
        "dob": patient.dob,
        "blood_group": patient.blood_group,
        "phone": crypto.aesgcm_decrypt_str(patient.phone_encrypted) if patient.phone_encrypted else None,
        "emergency_contact": crypto.aesgcm_decrypt_str(patient.emergency_contact_encrypted) if patient.emergency_contact_encrypted else None,
        "email": crypto.aesgcm_decrypt_str(patient.email_encrypted) if patient.email_encrypted else None,
        "address": crypto.aesgcm_decrypt_str(patient.address_encrypted) if patient.address_encrypted else None,
    }


@router.post("/patient/{patient_id}/update-request")
def request_patient_update(
    patient_id: str,
    changes: dict,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db)

    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    now = utcnow()

    # ------------------------------------------------
    # Validate doctor has ENTRY access
    # ------------------------------------------------

    session_obj = db.exec(
        select(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == doctor_id,
            models.PatientAccessSession.patient_id == patient_id
        )
    ).first()

    if not session_obj or is_expired(session_obj.entry_expires_at):
        raise HTTPException(403, "No entry access to this patient")


    # hospital id from session
    hospital_id = session_obj.hospital_id

    return crud.create_patient_update_request(
        db,
        patient_id,
        doctor_id,
        hospital_id,
        changes,
    )

# -------------------------------------------------------------------
# 7) Doctor sees patients with ENTRY ACCESS (24h window)
# -------------------------------------------------------------------
@router.get("/my-entry-access")
def list_my_entry_access(
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db)
):

    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    now = utcnow()

    rows = db.exec(
        select(
            models.PatientAccessSession,
            models.Patient
        )
        .join(
            models.Patient,
            models.Patient.id == models.PatientAccessSession.patient_id
        )
        .where(
            models.PatientAccessSession.doctor_id == doctor_id
        )
        .order_by(models.PatientAccessSession.entry_expires_at.asc())
    ).all()

    result = []

    for session_obj, patient in rows:

        entry_expiry = session_obj.entry_expires_at

        entry_expiry = ensure_utc(session_obj.entry_expires_at)

        if is_expired(entry_expiry):
            continue

        full_name = " ".join(
            filter(None, [
                patient.first_name,
                patient.middle_name,
                patient.last_name
            ])
        )

        result.append({
            "patient_id": str(patient.id),
            "patient_name": full_name,
            "view_expires_at": ensure_utc(session_obj.view_expires_at).isoformat(),
            "entry_access_expires_at": ensure_utc(session_obj.entry_expires_at).isoformat(),
            "remaining_seconds" : seconds_remaining(entry_expiry)
        })

    return result
