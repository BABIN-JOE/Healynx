#api/v1/hospital/hospital_profile.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import crud
from app.core import crypto

router = APIRouter()

@router.get("/me")
def get_hospital_profile(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db)   
):
    hospital_id = payload["hospital_id"]

    hospital = crud.get_hospital(db, hospital_id)
    if not hospital:
        raise HTTPException(404, "Hospital not found")

    return {
        "id": str(hospital.id),
        "hospital_name": hospital.hospital_name,
        "license_number": hospital.license_number,
        "owner_first_name": hospital.owner_first_name,
        "owner_middle_name": hospital.owner_middle_name,
        "owner_last_name": hospital.owner_last_name,
        "phone": crypto.aesgcm_decrypt_str(hospital.phone_encrypted) if hospital.phone_encrypted else None,
        "email": crypto.aesgcm_decrypt_str(hospital.email_encrypted) if hospital.email_encrypted else None,
        "address": crypto.aesgcm_decrypt_str(hospital.address_encrypted) if hospital.address_encrypted else None,
        "is_active": hospital.is_active
    }
