# app/api/v1/doctor/register.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.db import crud
from app.core import crypto, security
from app.schemas import DoctorRequestCreate
from app.core.audit import log_action

router = APIRouter()

@router.post("/register")
def register_doctor(body: DoctorRequestCreate, db = Depends(get_db)):
    aadhaar_hash = crypto.aadhaar_hash_hex(body.aadhaar)
    aadhaar_enc = crypto.aesgcm_encrypt_str(body.aadhaar)

    phone_enc = crypto.aesgcm_encrypt_str(body.phone) if body.phone else None
    email_enc = crypto.aesgcm_encrypt_str(body.email) if body.email else None
    address_dict = body.address.model_dump()

    pwd_hash = security.hash_password(body.password)

    existing = crud.get_doctor_by_license(db, body.license_number)
    if existing:
        raise HTTPException(400, "Doctor already registered with this license number")

    req = crud.create_doctor_request(
        db,
        first_name=body.first_name,
        middle_name=body.middle_name,
        last_name=body.last_name,
        dob=body.dob,
        gender = body.gender,
        specialization = body.specialization,
        aadhaar_encrypted=aadhaar_enc,
        aadhaar_hash=aadhaar_hash,
        license_number=body.license_number,
        phone_encrypted=phone_enc,
        email_encrypted=email_enc,
        address_obj=address_dict,
        password_hash=pwd_hash,
        hospital_id=None,
        status="pending",
    )

    log_action(
        db,
        action_type="doctor.self_register",
        user_role="doctor",
        user_id=None,
        target_entity="doctor_requests",
        target_entity_id=req.id
    )

    return {"message": "Doctor registration submitted", "request_id": str(req.id)}
