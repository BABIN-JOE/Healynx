from app.core.time import entry_expiry_time
from sqlmodel import Session
from app.db import models
from uuid import UUID


def create_surgery_pending(
    db: Session,
    patient_id,
    doctor_id,
    hospital_id,
    surgery_name,
    surgery_date,
    body_part=None,
    reason=None,
    description=None,
    notes=None,
    parent_surgery_id=None,
    followup_condition=None,
    admit_date=None,
    discharge_date=None,
    medication_name=None,
    medication_start_date=None,
    medication_end_date=None,
):

    patient_id = UUID(str(patient_id))
    doctor_id = UUID(str(doctor_id))
    hospital_id = UUID(str(hospital_id))

    if parent_surgery_id and not surgery_name:
        parent = db.get(models.Surgery, parent_surgery_id)
        if parent:
            surgery_name = parent.surgery_name

    obj = models.SurgeryPending(
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,

        parent_surgery_id=parent_surgery_id,

        surgery_name=surgery_name,
        body_part=body_part,
        reason=reason,
        description=description,
        notes=notes,

        surgery_date=surgery_date,
        admit_date=admit_date,
        discharge_date=discharge_date,

        followup_condition=followup_condition,

        medication_name=medication_name,
        medication_start_date=medication_start_date,
        medication_end_date=medication_end_date,

        expires_at=entry_expiry_time(),
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj
