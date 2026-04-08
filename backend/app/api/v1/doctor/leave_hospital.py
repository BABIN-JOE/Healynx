from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import HospitalDoctorMap

router = APIRouter()


@router.post("/leave-hospital")
def leave_hospital(
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db)
    doctor_id = payload.get("doctor_id")

    mapping = db.exec(
        select(HospitalDoctorMap).where(
            HospitalDoctorMap.doctor_id == doctor_id,
            HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if not mapping:
        raise HTTPException(404, "Doctor is not assigned to any hospital")

    mapping.soft_deleted = True
    db.add(mapping)
    db.commit()

    return {"message": "Left hospital successfully"}