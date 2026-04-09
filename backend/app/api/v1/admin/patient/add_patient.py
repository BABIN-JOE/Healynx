from fastapi import APIRouter, Depends, Request, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.schemas import PatientCreate
from app.core import crypto
from app.db import crud
from app.core.audit import log_action

router = APIRouter()


@router.post("/patients")
def add_patient(
    body: PatientCreate,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
    request: Request = None
):
    
    verify_csrf(request, db)
    valid_groups = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}

    if body.blood_group not in valid_groups:
        raise HTTPException(400, "Invalid blood group")

    aadhaar_enc = crypto.aesgcm_encrypt_str(body.aadhaar)
    aadhaar_hash = crypto.aadhaar_hash_hex(body.aadhaar)

    patient = crud.create_patient(
        db,
        first_name=body.first_name,
        middle_name=body.middle_name,
        last_name=body.last_name,
        gender=body.gender,
        dob=body.dob,
        father_name=body.father_name,
        mother_name=body.mother_name,
        address_obj=body.address,
        phone_encrypted=crypto.aesgcm_encrypt_str(body.phone),
        emergency_contact_encrypted=crypto.aesgcm_encrypt_str(body.emergency_contact),
        email_encrypted=(
            crypto.aesgcm_encrypt_str(body.email)
            if body.email else None
        ),
        aadhaar_encrypted=aadhaar_enc,
        aadhaar_hash=aadhaar_hash,
        created_by=(
            payload.get("user_id")
            or payload.get("admin_id")
            or payload.get("master_id")
            or payload.get("doctor_id")
            or payload.get("hospital_id")
        ),
        blood_group=body.blood_group,
    )

    if body.phone == body.emergency_contact:
        raise HTTPException(
            status_code=400,
            detail="Emergency contact number must be different from primary phone number"
        )

    log_action(
        db,
        action_type="admin.add_patient",
        user_role="admin",
        user_id=payload["user_id"],
        target_entity="patients",
        target_entity_id=patient.id,
        ip=request.client.host if request else None
    )

    return {"patient_id": str(patient.id)}
