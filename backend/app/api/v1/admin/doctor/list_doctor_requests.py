from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Optional

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import DoctorRequest, Hospital
from app.core import crypto

router = APIRouter()

@router.get("/doctor-requests", summary="List doctor registration / join requests")
def list_doctor_requests(
    status: Optional[str] = None,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db)
):
    if status:
        q = select(DoctorRequest).where(DoctorRequest.status == status)
    else:
        q = select(DoctorRequest).where(DoctorRequest.status == "pending")

    requests = db.exec(q).all()

    result = []
    for d in requests:

        # Build full doctor name
        full_name = " ".join(filter(None, [d.first_name, d.middle_name, d.last_name]))

        # Resolve hospital name if hospital_id present
        hospital_name = None
        if d.hospital_id:
            h = db.get(Hospital, d.hospital_id)
            hospital_name = h.hospital_name if h else None

        # Aadhaar masking — NEVER expose full Aadhaar
        aadhaar_dec = crypto.aesgcm_decrypt_str(d.aadhaar_encrypted)
        aadhaar_last4 = aadhaar_dec[-4:] if aadhaar_dec else None

        result.append({
            "id": d.id,
            "hospital_id": d.hospital_id,
            "hospital_name": hospital_name,
            "full_name": full_name,
            "specialization": d.specialization,
            "license_number": d.license_number,
            "aadhaar_last4": aadhaar_last4,
            "phone": crypto.aesgcm_decrypt_str(d.phone_encrypted) if d.phone_encrypted else None,
            "email": crypto.aesgcm_decrypt_str(d.email_encrypted) if d.email_encrypted else None,
            "address": crypto.aesgcm_decrypt_str(d.address_encrypted) if d.address_encrypted else None,
            "status": d.status,
            "submitted_at": d.submitted_at,
        })

    return result
