from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from uuid import UUID

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud, models
from app.core import jwt_utils, security
from app.config import settings

router = APIRouter()


# ============================================
# CREATE DOCTOR SESSION (UNCHANGED)
# ============================================
@router.post("/hospital/{hospital_id}/create-session")
def create_session(
    hospital_id: str,
    doctor_id: str,
    doctor_password: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db)

    if payload.get("hospital_id") != hospital_id:
        raise HTTPException(403, "Hospital mismatch")

    if not crud.verify_doctor_credentials(
        db, doctor_id, doctor_password, security.verify_password
    ):
        raise HTTPException(401, "Invalid credentials")

    token = jwt_utils.create_jwt(
        {
            "role": Role.DOCTOR,
            "doctor_id": doctor_id,
            "hospital_id": hospital_id
        },
        minutes=settings.DOCTOR_SESSION_MINUTES
    )

    return {"token": token}


# ============================================
# ✅ NEW: GET DOCTOR HOSPITAL (IMPORTANT)
# ============================================
@router.get("/my-hospital")
def get_my_hospital(
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db)
):
    doctor_id = payload.get("doctor_id")

    try:
        doctor_id = UUID(doctor_id)
    except Exception:
        raise HTTPException(400, "Invalid doctor ID in token")

    mapping = db.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            (models.HospitalDoctorMap.soft_deleted == False) |
            (models.HospitalDoctorMap.soft_deleted.is_(None))
        )
    ).first()

    if not mapping:
        return {"mapped": False}

    hospital = db.get(models.Hospital, mapping.hospital_id)

    return {
        "mapped": True,
        "hospital": {
            "id": hospital.id,
            "name": hospital.hospital_name,
            "license_number": hospital.license_number,
        }
    }
