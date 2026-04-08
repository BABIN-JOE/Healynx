from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import HospitalDoctorMap, Doctor

router = APIRouter(prefix="/doctors", tags=["Hospital Doctors"])


@router.get("/")
def list_doctors(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]

    # 🔥 JOIN Doctor table
    rows = db.exec(
        select(HospitalDoctorMap, Doctor)
        .join(Doctor, HospitalDoctorMap.doctor_id == Doctor.id)
        .where(
            HospitalDoctorMap.hospital_id == hospital_id,
            HospitalDoctorMap.is_active == True,
            HospitalDoctorMap.soft_deleted == False,
        )
    ).all()

    result = []

    for mapping, doctor in rows:
        full_name = " ".join(
            filter(None, [doctor.first_name, doctor.middle_name, doctor.last_name])
        )

        result.append({
            "doctor_id": str(doctor.id),
            "name": f"Dr. {full_name}",
            "specialization": doctor.specialization,
            "role": mapping.role,
            "joined_at": mapping.added_at,
        })

    return result