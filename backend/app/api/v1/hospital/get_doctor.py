from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Doctor, HospitalDoctorMap
from app.core import crypto

router = APIRouter(tags=["Hospital Doctors"])


@router.get("/doctors/{doctor_id}")
def get_doctor(
    doctor_id: UUID,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]

    # 🔐 Ensure doctor belongs to hospital
    mapping = db.exec(
        select(HospitalDoctorMap).where(
            HospitalDoctorMap.hospital_id == hospital_id,
            HospitalDoctorMap.doctor_id == doctor_id,
            HospitalDoctorMap.is_active == True,
            HospitalDoctorMap.soft_deleted == False,
        )
    ).first()

    if not mapping:
        raise HTTPException(404, "Doctor not assigned to this hospital")

    doctor = db.get(Doctor, doctor_id)

    if not doctor or not doctor.is_active:
        raise HTTPException(404, "Doctor not found")

    return {
        "id": doctor.id,
        "first_name": doctor.first_name,
        "middle_name": doctor.middle_name,
        "last_name": doctor.last_name,
        "specialization": doctor.specialization,
        "license_number": doctor.license_number,
        "gender": doctor.gender,
        "email": crypto.aesgcm_decrypt_str(doctor.email_encrypted)
        if doctor.email_encrypted
        else None,
        "phone": crypto.aesgcm_decrypt_str(doctor.phone_encrypted)
        if doctor.phone_encrypted
        else None,
        "joined_at": mapping.added_at,
    }
