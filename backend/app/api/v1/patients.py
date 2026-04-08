# app/api/v1/patients.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud
from app.core import crypto
from app.core.audit import log_action

router = APIRouter()


# ---------------------------------------------------------
# SEARCH PATIENT (By Aadhaar)
# ---------------------------------------------------------
@router.get("/search")
def search_patient(
    aadhaar: str,
    payload=Depends(require_role([Role.ADMIN, Role.DOCTOR, Role.HOSPITAL])),
    db = Depends(get_db),
):
    h = crypto.aadhaar_hash_hex(aadhaar)
    p = crud.get_patient_by_aadhaar_hash(db, h)

    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    full_name = f"{p.first_name} {p.middle_name + ' ' if p.middle_name else ''}{p.last_name}"

    return {
        "id": str(p.id),
        "full_name": full_name,
        "dob": p.dob,
    }


# ---------------------------------------------------------
# DOCTOR VIEW TIMELINE
# ---------------------------------------------------------
@router.get("/{patient_id}/timeline")
def patient_timeline(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    entries = crud.get_medical_entries_for_patient(db, patient_id)

    log_action(
        db,
        action_type="doctor.view_patient_timeline",
        user_role="doctor",
        user_id=payload.get("doctor_id"),
        hospital_id=payload.get("hospital_id"),
        target_entity="medical_entries",
        target_entity_id=None,
        ip=request.client.host if request else None,
    )

    return entries


# ---------------------------------------------------------
# GET PATIENT DETAILS
# ---------------------------------------------------------
@router.get("/{patient_id}")
def get_patient_details(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR, Role.ADMIN, Role.HOSPITAL])),
    db = Depends(get_db),
):
    p = crud.get_patient_by_id(db, patient_id)

    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Decrypt sensitive fields
    phone = crypto.aesgcm_decrypt_str(p.phone_encrypted)
    emergency_contact = crypto.aesgcm_decrypt_str(p.emergency_contact_encrypted)
    email = (
        crypto.aesgcm_decrypt_str(p.email_encrypted)
        if p.email_encrypted
        else None
    )
    address = crypto.aesgcm_decrypt_str(p.address_encrypted)

    full_name = f"{p.first_name} {p.middle_name + ' ' if p.middle_name else ''}{p.last_name}"

    return {
        "id": str(p.id),
        "full_name": full_name,
        "gender": p.gender,
        "dob": p.dob,
        "blood_group": p.blood_group,
        "phone": phone,
        "emergency_contact": emergency_contact,
        "email": email,
        "address": address,
    }


# ---------------------------------------------------------
# DOCTOR UPDATE BLOOD GROUP
# ---------------------------------------------------------
@router.put("/{patient_id}/blood-group")
def update_blood_group(
    patient_id: str,
    blood_group: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    
    verify_csrf(request, db)

    valid_groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}

    if blood_group not in valid_groups:
        raise HTTPException(status_code=400, detail="Invalid blood group")

    p = crud.get_patient_by_id(db, patient_id)

    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    p.blood_group = blood_group
    db.add(p)
    db.commit()

    log_action(
        db,
        action_type="doctor.update_blood_group",
        user_role="doctor",
        user_id=payload.get("doctor_id"),
        hospital_id=payload.get("hospital_id"),
        target_entity="patients",
        target_entity_id=patient_id,
        ip=request.client.host if request else None,
    )

    return {"message": "Blood group updated successfully"}
