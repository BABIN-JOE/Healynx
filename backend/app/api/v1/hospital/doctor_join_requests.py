from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.core import crypto
from app.db.models import DoctorRequest

router = APIRouter(prefix="/doctor-join-requests")

@router.get("/")
def list_hospital_doctor_requests(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db)
):
    hospital_id = payload["hospital_id"]

    q = select(DoctorRequest).where(
        DoctorRequest.hospital_id == hospital_id,
        DoctorRequest.status == "hospital_pending"
    )

    rows = db.exec(q).all()
    def full_name(first, middle, last):
        return " ".join(filter(None, [first, middle, last]))
    result = []
    for r in rows:
        result.append({
            "id": r.id,
            "first_name": r.first_name,
            "middle_name": r.middle_name,
            "last_name": r.last_name,
            "license_number": r.license_number,
            "aadhaar": crypto.decrypt(r.aadhaar_encrypted),
            "phone": crypto.decrypt(r.phone_encrypted),
            "email": crypto.decrypt(r.email_encrypted),
            "address": crypto.decrypt_json(r.address_encrypted),
            "submitted_at": r.submitted_at,
            "status": r.status
        })

    return result
