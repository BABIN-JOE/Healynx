from app.core.time import utcnow
from datetime import timedelta
from typing import List
from uuid import UUID

from sqlmodel import Session, select
from app.db import models


# ------------------------------------------------------------------
# HELPER: Normalize datetime for safe comparison
# ------------------------------------------------------------------

def normalize(dt):
    """
    Converts datetime to timezone-naive UTC for safe comparison.
    Prevents naive vs aware datetime errors.
    """
    if not dt:
        return None

    if dt.tzinfo:
        return dt.replace(tzinfo=None)

    return dt


# ------------------------------------------------------------------
# DOCTOR PENDING HISTORY
# ------------------------------------------------------------------

def get_doctor_pending_history(db: Session, doctor_id) -> List:
    """
    Returns pending-related entries created by doctor and visible for 72 hours.
    Only shows entries from the doctor's current active hospital membership.
    """

    doctor_id = UUID(str(doctor_id))

    current_mapping = db.exec(
        select(models.HospitalDoctorMap)
        .where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            models.HospitalDoctorMap.soft_deleted == False,
            models.HospitalDoctorMap.is_active == True,
        )
        .order_by(models.HospitalDoctorMap.added_at.desc())
    ).first()

    if not current_mapping:
        return []

    current_hospital_id = current_mapping.hospital_id
    now = normalize(utcnow())
    visibility_limit = now - timedelta(hours=72)

    result = []

    pending_models = [
        models.VisitPending,
        models.SurgeryPending,
        models.AllergyPending,
        models.LabPending,
        models.ImmunizationPending,
        models.LongTermConditionPending,
    ]

    for model in pending_models:

        rows = db.exec(
            select(model)
            .where(
                model.doctor_id == doctor_id,
                model.hospital_id == current_hospital_id,
                model.created_at >= visibility_limit,
            )
            .order_by(model.created_at.desc())
        ).all()

        for row in rows:

            expires_at = normalize(row.expires_at)

            # ------------------------------------------------
            # AUTO EXPIRE if hospital did not approve in 24h
            # ------------------------------------------------
            if (
                row.status == "pending"
                and expires_at
                and expires_at <= now
            ):
                row.status = "expired"
                db.add(row)

            result.append(row)

    db.commit()

    return result


# ------------------------------------------------------------------
# CLEANUP EXPIRED PENDING RECORDS
# ------------------------------------------------------------------

def cleanup_doctor_visible_entries(db: Session):
    """
    Marks expired pending entries automatically.
    Does NOT delete them.
    """

    now = normalize(utcnow())

    pending_models = [
        models.VisitPending,
        models.SurgeryPending,
        models.AllergyPending,
        models.LabPending,
        models.ImmunizationPending,
        models.LongTermConditionPending,
    ]

    for model in pending_models:

        rows = db.exec(
            select(model).where(
                model.status == "pending",
                model.expires_at != None
            )
        ).all()

        for row in rows:

            expires_at = normalize(row.expires_at)

            if expires_at and expires_at <= now:
                row.status = "expired"
                db.add(row)

    db.commit()