from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud
from app.db.models import Doctor, Patient
from app.core.audit import log_action
from app.core.time import *

router = APIRouter(prefix="/medical/access-requests", tags=["Hospital Medical"])


# -------------------------------------------------------------------
# LIST PENDING PATIENT ACCESS REQUESTS (DEDUPED)
# -------------------------------------------------------------------
@router.get("/")
def list_patient_access_requests(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]

    rows = crud.list_pending_patient_access_requests_for_hospital(db, hospital_id)

    latest_per_patient = {}

    for r in rows:
        key = (r.get("doctor_id"), r.get("patient_aadhaar_hash"))

        # keep only first occurrence (already ordered by created_at desc in CRUD)
        if key in latest_per_patient:
            continue

        status = r.get("status")
        expires_at = r.get("expires_at")

        expired = is_expired(expires_at)
        can_act = status == "pending" and not expired

        # ---------------------------
        # DOCTOR RESOLUTION
        # ---------------------------
        doctor_name = "—"
        doctor_id = None
        if r.get("doctor_id"):
            doctor = db.get(Doctor, r["doctor_id"])
            if doctor:
                doctor_id = doctor.id
                doctor_name = " ".join(
                    filter(None, [doctor.first_name, doctor.last_name])
                )

        # ---------------------------
        # PATIENT RESOLUTION
        # ---------------------------
        patient_name = "—"
        patient_id = None
        if r.get("patient_aadhaar_hash"):
            patient = db.exec(
                select(Patient).where(
                    Patient.aadhaar_hash == r["patient_aadhaar_hash"]
                )
            ).first()

            if patient:
                patient_id = patient.id
                patient_name = " ".join(
                    filter(None, [patient.first_name, patient.middle_name, patient.last_name])
                )

        latest_per_patient[key] = {
            "id": r.get("id"),
            "status": status,
            "expires_in": seconds_remaining(expires_at),
            "can_act": can_act,
            "doctor_id": doctor_id,
            "doctor_name": doctor_name,
            "patient_id": patient_id,
            "patient_name": patient_name,
        }

    return list(latest_per_patient.values())


# -------------------------------------------------------------------
# APPROVE PATIENT ACCESS REQUEST
# -------------------------------------------------------------------
@router.post("/{req_id}/approve")
def approve_patient_access_request(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    verify_csrf(request, db) 
    hospital_id = payload["hospital_id"]

    req = crud.approve_patient_access_request(db, req_id, hospital_id)
    if not req:
        raise HTTPException(400, "Cannot approve request (expired or invalid)")

    log_action(
        db,
        action_type="hospital.approve_patient_access",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="patient_access_request",
        target_entity_id=req_id,
    )

    return {"message": "Patient access approved"}


# -------------------------------------------------------------------
# DECLINE PATIENT ACCESS REQUEST
# -------------------------------------------------------------------
@router.post("/{req_id}/decline")
def decline_patient_access_request(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    verify_csrf(request, db) 
    hospital_id = payload["hospital_id"]

    req = crud.decline_patient_access_request(db, req_id, hospital_id)
    if not req:
        raise HTTPException(400, "Cannot decline request (expired or invalid)")

    log_action(
        db,
        action_type="hospital.decline_patient_access",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="patient_access_request",
        target_entity_id=req_id,
    )

    return {"message": "Patient access declined"}
