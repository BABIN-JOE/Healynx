#src/app/api/v1/hospital/patient_update_requests.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from app.core.time import *
from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import models, crud
from app.core.audit import log_action

# -------------------------------------------------------------------
# Hospital — Patient Profile Update Requests
# -------------------------------------------------------------------
router = APIRouter()


# -------------------------------------------------------------------
# LIST PENDING PROFILE UPDATE REQUESTS (24h expiry)
# -------------------------------------------------------------------
@router.get("/pending-profile-updates")
def list_profile_update_requests(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload.get("hospital_id")
    now = utcnow()

    rows = db.exec(
        select(
            models.PatientUpdateRequest,
            models.Patient,
            models.Doctor
        )
        .join(
            models.Patient,
            models.Patient.id == models.PatientUpdateRequest.patient_id
        )
        .join(
            models.Doctor,
            models.Doctor.id == models.PatientUpdateRequest.doctor_id
        )
        .where(
            models.PatientUpdateRequest.hospital_id == hospital_id,
            models.PatientUpdateRequest.status == "pending"
        )
        .order_by(models.PatientUpdateRequest.created_at.desc())
    ).all()

    response = []
    expired_requests = []

    for req, patient, doctor in rows:

        # -----------------------------
        # SAFE EXPIRY CHECK
        # -----------------------------
        expires_at = req.expires_at

        if is_expired(expires_at):
            req.status = "expired"
            expired_requests.append(req)
            continue

        # -----------------------------
        # BUILD NAMES
        # -----------------------------
        patient_name = " ".join(
            filter(None, [
                patient.first_name,
                patient.middle_name,
                patient.last_name
            ])
        )

        doctor_name = " ".join(
            filter(None, [
                doctor.first_name,
                doctor.last_name
            ])
        )

        response.append({
            "id": str(req.id),
            "patient_id": str(patient.id),
            "patient_name": patient_name,
            "doctor_id": str(doctor.id),
            "doctor_name": doctor_name,
            "requested_changes": req.requested_changes,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "expires_in": seconds_remaining(expires_at),
            "can_act": req.status == "pending" and not is_expired(expires_at)
        })

    if expired_requests:
        for req in expired_requests:
            db.add(req)
        db.commit()

    return response


# -------------------------------------------------------------------
# APPROVE PROFILE UPDATE REQUEST
# -------------------------------------------------------------------
@router.post("/pending-profile-updates/{req_id}/approve")
def approve_profile_update_request(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db)):
    hospital_id = payload.get("hospital_id")

    req = crud.approve_patient_update_request(
        db,
        req_id,
        hospital_id
    )

    if not req:
        raise HTTPException(
            status_code=400,
            detail="Invalid, expired, or already processed request"
        )

    log_action(
        db,
        action_type="hospital.approve_profile_update",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="patient_update_request",
        target_entity_id=req_id,
        ip=request.client.host if request else None,
    )

    return {"message": "Profile update approved"}


# -------------------------------------------------------------------
# DECLINE PROFILE UPDATE REQUEST
# -------------------------------------------------------------------
@router.post("/pending-profile-updates/{req_id}/decline")
def decline_profile_update_request(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db)):
    hospital_id = payload.get("hospital_id")

    req = crud.decline_patient_update_request(
        db,
        req_id,
        hospital_id
    )

    if not req:
        raise HTTPException(
            status_code=400,
            detail="Invalid, expired, or already processed request"
        )

    log_action(
        db,
        action_type="hospital.decline_profile_update",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="patient_update_request",
        target_entity_id=req_id,
        ip=request.client.host if request else None,
    )

    return {"message": "Profile update declined"}
