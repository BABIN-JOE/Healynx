from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core import crypto
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.db import models

router = APIRouter(
    prefix="/doctor-join-requests",
    tags=["Hospital"]
)


@router.get("/{req_id}")
def get_doctor_join_request(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload.get("hospital_id")

    req = db.exec(
        select(models.DoctorRequest).where(
            models.DoctorRequest.id == req_id,
            models.DoctorRequest.hospital_id == hospital_id,
        )
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Doctor join request not found")

    return {
        "id": req.id,
        "first_name": req.first_name,
        "middle_name": req.middle_name,
        "last_name": req.last_name,
        "dob": req.dob,
        "gender": req.gender,
        "specialization": req.specialization,
        "license_number": req.license_number,

        "aadhaar": crypto.decrypt(req.aadhaar_encrypted),
        "phone": crypto.decrypt(req.phone_encrypted),
        "email": crypto.decrypt(req.email_encrypted),
        "address": crypto.decrypt_json(req.address_encrypted),

        "submitted_at": req.submitted_at,
        "status": req.status
    }
