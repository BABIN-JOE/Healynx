from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import func

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import models

router = APIRouter(tags=["Doctor - Dashboard"])


@router.get("/dashboard-stats")
def get_doctor_dashboard_stats(
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db)
):

    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    # ------------------------------------------------
    # 1️⃣ Check hospital mapping
    # ------------------------------------------------

    mapping = db.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            models.HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if not mapping:
        return {
            "patient_access_requests": 0,
            "pending_entries": 0
        }

    # ------------------------------------------------
    # 2️⃣ Patient Access Requests (pending)
    # ------------------------------------------------

    access_count = db.exec(
        select(func.count(models.PatientAccessRequest.id)).where(
            models.PatientAccessRequest.doctor_id == doctor_id,
            models.PatientAccessRequest.status == "pending"
        )
    ).one()

    # ------------------------------------------------
    # 3️⃣ Pending Medical Entries (ALL TYPES)
    # ------------------------------------------------

    pending_models = [
        models.VisitPending,
        models.SurgeryPending,
        models.AllergyPending,
        models.LabPending,
        models.ImmunizationPending,
        models.LongTermConditionPending,
    ]

    total_pending = 0

    for model in pending_models:
        count = db.exec(
            select(func.count(model.id)).where(
                model.doctor_id == doctor_id,
                model.status == "pending"
            )
        ).one()

        total_pending += count

    return {
        "patient_access_requests": access_count,
        "pending_entries": total_pending
    }