from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import crud

router = APIRouter()

@router.get("/doctor-requests/{req_id}")
def get_doctor_join_request(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    req = crud.get_doctor_request_by_id(db, req_id)

    if not req:
        raise HTTPException(404, "Doctor request not found")

    return {
        "id": str(req.id),
        "first_name": req.first_name,
        "middle_name": req.middle_name,
        "last_name": req.last_name,
        "dob": req.dob,
        "gender": req.gender,
        "specialization": req.specialization,
        "license_number": req.license_number,
        "phone": req.phone_hash,
        "email": req.email_hash,
        "status": req.status,
        "submitted_at": req.submitted_at,
    }
