# app/api/v1/doctor/join_hospital.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import DoctorRequest, HospitalDoctorMap
from app.db import crud
from app.core.audit import log_action

router = APIRouter()

@router.post("/request-join/{hospital_license}")
def request_join(
    hospital_license: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):
    doctor_id = payload.get("doctor_id")

    doc = crud.get_doctor_by_id(db, doctor_id)
    if not doc:
        raise HTTPException(403, "Doctor not approved")

    hospital = crud.get_hospital_by_license(db, hospital_license)
    if not hospital:
        raise HTTPException(404, "Hospital not found")
    
    if not doc.specialization:
        raise HTTPException(
            status_code=400,
            detail="Doctor specialization is required before requesting hospital join"
        )

    req = crud.create_doctor_request(
        db,
        doctor_id=doctor_id,
        hospital_id=hospital.id,
        first_name=doc.first_name,
        last_name=doc.last_name,
        specialization=doc.specialization,
        gender=doc.gender,
        dob=doc.dob,
        aadhaar_encrypted=doc.aadhaar_encrypted,
        aadhaar_hash=doc.aadhaar_hash,
        license_number=doc.license_number,
        phone_encrypted=doc.phone_encrypted,
        email_encrypted=doc.email_encrypted,
        address_encrypted=doc.address_encrypted,
        password_hash=doc.password_hash,
        status="hospital_pending"
    )

    log_action(
        db,
        action_type="doctor.request_join_hospital",
        user_role="doctor",
        user_id=doctor_id,
        target_entity_id=req.id
    )

    return {"message": "Join request submitted"}
