from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import HospitalRequest
from app.core import crypto

router = APIRouter()

@router.get("/hospital-requests/{req_id}")
def get_hospital_request(
    req_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db)
):
    r = db.get(HospitalRequest, req_id)
    if not r:
        raise HTTPException(404, "Hospital request not found")

    owner_name = " ".join(
        filter(None, [r.owner_first_name, r.owner_middle_name, r.owner_last_name])
    )

    return {
        "id": r.id,
        "hospital_name": r.hospital_name,
        "license_number": r.license_number,
        "owner_name": owner_name,
        "owner_aadhaar": crypto.aesgcm_decrypt_str(r.owner_aadhaar_encrypted),
        "phone": crypto.aesgcm_decrypt_str(r.phone_encrypted) if r.phone_encrypted else None,
        "email": crypto.aesgcm_decrypt_str(r.email_encrypted) if r.email_encrypted else None,
        "address": crypto.aesgcm_decrypt_str(r.address_encrypted) if r.address_encrypted else None,
        "status": r.status,
        "submitted_at": r.submitted_at,
        "reviewed_by": r.reviewed_by,
        "reviewed_at": r.reviewed_at,

    }
