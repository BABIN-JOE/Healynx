from app.core.time import entry_expiry_time, utcnow
from sqlmodel import Session
from app.db import models
from uuid import UUID


def create_visit_pending(
    db: Session,
    patient_id,
    doctor_id,
    hospital_id,
    chief_complaint=None,
    diagnosis=None,
    notes=None,
    followup_condition=None,
    parent_visit_id=None,
    medication_name=None,
    medication_start_date=None,
    medication_end_date=None,
):

    patient_id = UUID(str(patient_id))
    doctor_id = UUID(str(doctor_id))
    hospital_id = UUID(str(hospital_id))

    if parent_visit_id:
        parent_visit_id = UUID(str(parent_visit_id))

    obj = models.VisitPending(
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,

        parent_visit_id=parent_visit_id,

        visit_date=utcnow(),

        chief_complaint=chief_complaint,
        diagnosis=diagnosis,
        notes=notes,
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
