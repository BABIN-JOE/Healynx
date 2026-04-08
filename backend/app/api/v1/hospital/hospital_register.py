from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.deps import get_db
from app.core import crypto, security
from app.db import crud
from app.schemas import HospitalRequestCreate
from app.core.audit import log_action

router = APIRouter()


@router.post("/register")
def register_hospital(
    body: HospitalRequestCreate,
    db = Depends(get_db)
):
    # Encrypt Aadhaar
    owner_enc = crypto.aesgcm_encrypt_str(body.owner_aadhaar)
    owner_hash = crypto.aadhaar_hash_hex(body.owner_aadhaar)

    # Encrypt phone/email normally
    phone_enc = crypto.aesgcm_encrypt_str(body.phone) if body.phone else None
    email_enc = crypto.aesgcm_encrypt_str(body.email) if body.email else None

    # IMPORTANT: Address is a Pydantic object → convert to dict → CRUD encrypts internally
    address_obj = body.address.dict() if body.address else None

    # Password hashing
    pwd_hash = security.hash_password(body.password) if body.password else None

    # Create hospital registration request
    req = crud.create_hospital_request(
        db,
        hospital_name=body.hospital_name,
        license_number=body.license_number,
        owner_first_name=body.owner_first_name,
        owner_middle_name=body.owner_middle_name,
        owner_last_name=body.owner_last_name,
        owner_aadhaar_encrypted=owner_enc,
        owner_aadhaar_hash=owner_hash,
        phone_encrypted=phone_enc,
        email_encrypted=email_enc,
        address_obj=address_obj,
        password_hash=pwd_hash
    )

    # Audit log
    log_action(
        db,
        action_type="hospital.register",
        user_role="public",
        target_entity="hospital_requests",
        target_entity_id=req.id
    )

    return {
        "request_id": str(req.id),
        "message": "Hospital registration submitted successfully"
    }
