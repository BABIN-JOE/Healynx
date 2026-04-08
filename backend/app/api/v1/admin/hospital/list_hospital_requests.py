from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Optional
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import HospitalRequest
from app.core import crypto

router = APIRouter()

@router.get("/hospital-requests", summary="List Hospital Requests")
def list_hospital_requests(
    status: Optional[str] = None,
    payload = Depends(require_role([Role.ADMIN])),
    db = Depends(get_db)
):
    q = select(HospitalRequest)

    if status:
        q = q.where(HospitalRequest.status == status)

    reqs = db.exec(q).all()

    result = []
    for r in reqs:

        owner_name = " ".join(
            filter(None, [r.owner_first_name, r.owner_middle_name, r.owner_last_name])
        )

        result.append({
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
        })

    return result
