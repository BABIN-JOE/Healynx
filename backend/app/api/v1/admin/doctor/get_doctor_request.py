from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import DoctorRequest
from app.core.crypto import aesgcm_decrypt_str
import json

router = APIRouter()

@router.get("/doctor-requests/{req_id}", summary="Get doctor registration request details")
def get_doctor_request(req_id: str,
                       db = Depends(get_db),
                       payload = Depends(require_role([Role.ADMIN]))):

    req = db.get(DoctorRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Doctor request not found")

    # decrypt fields
    try:
        address = json.loads(aesgcm_decrypt_str(req.address_encrypted)) if req.address_encrypted else None
    except:
        address = None

    return {
        "id": req.id,
        "first_name": req.first_name,
        "middle_name": req.middle_name,
        "last_name": req.last_name,
        "dob": req.dob,
        "gender": req.gender,
        "specialization": req.specialization,
        "aadhaar": aesgcm_decrypt_str(req.aadhaar_encrypted),
        "email": aesgcm_decrypt_str(req.email_encrypted),
        "phone": aesgcm_decrypt_str(req.phone_encrypted),
        "license_number": req.license_number,
        "address": address,
        "requested_at": req.submitted_at,
        "status": req.status,
        "reviewed_by": req.reviewed_by,
        "reviewed_at": req.reviewed_at,

    }
