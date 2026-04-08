from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import HospitalDoctorMap
from app.core.audit import log_action

router = APIRouter(tags=["Hospital Doctors"])


@router.post("/doctors/{doctor_id}/soft-delete")
def remove_doctor(
    doctor_id: UUID,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]

    mapping = db.exec(
        select(HospitalDoctorMap).where(
            HospitalDoctorMap.hospital_id == hospital_id,
            HospitalDoctorMap.doctor_id == doctor_id,
            HospitalDoctorMap.soft_deleted == False,
        )
    ).first()

    if not mapping:
        raise HTTPException(404, "Doctor not linked to this hospital")

    mapping.soft_deleted = True
    mapping.is_active = False

    db.add(mapping)
    db.commit()

    log_action(
        db,
        action_type="hospital.remove_doctor",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="hospital_doctor_map",
        target_entity_id=mapping.id,
    )

    return {"message": "Doctor removed from hospital"}
