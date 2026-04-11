from app.core.time import entry_expiry_time
from sqlmodel import Session
from app.db import models
from uuid import UUID


def create_long_term_condition_pending(
    db: Session,
    patient_id,
    doctor_id,
    hospital_id,
    condition_name,
    first_noted_date=None,
    current_condition=None,
    diagnosis=None,
    notes=None,
    parent_condition_id=None,
    medication_name=None,
    medication_start_date=None,
    medication_end_date=None,
):

    patient_id = UUID(str(patient_id))
    doctor_id = UUID(str(doctor_id))
    hospital_id = UUID(str(hospital_id))

    if parent_condition_id:
        parent_condition_id = UUID(str(parent_condition_id))

    obj = models.LongTermConditionPending(
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,

        parent_condition_id=parent_condition_id,

        condition_name=condition_name,
        first_noted_date=first_noted_date,

        current_condition=current_condition,
        diagnosis=diagnosis,
        notes=notes,

        medication_name=medication_name,
        medication_start_date=medication_start_date,
        medication_end_date=medication_end_date,

        expires_at=entry_expiry_time(),
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj
