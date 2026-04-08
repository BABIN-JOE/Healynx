from app.core.time import utcnow, ensure_utc
from sqlmodel import Session, select
from app.db import models
from datetime import timedelta
from uuid import UUID


def create_allergy_pending(
    db: Session,
    patient_id,
    doctor_id,
    hospital_id,
    allergy_type=None,
    body_location=None,
    severity=None,
    diagnosis=None,
    notes=None,
    first_noted_date=None,
    parent_allergy_id=None,
    followup_condition=None,
    medication_name=None,
    medication_start_date=None,
    medication_end_date=None,
):

    patient_id = UUID(str(patient_id))
    doctor_id = UUID(str(doctor_id))
    hospital_id = UUID(str(hospital_id))

    parent = None

    if parent_allergy_id:
        parent_allergy_id = UUID(str(parent_allergy_id))

        # Fetch parent allergy to inherit base fields
        parent = db.exec(
            select(models.Allergy).where(models.Allergy.id == parent_allergy_id)
        ).first()

        if parent:
            allergy_type = allergy_type or parent.allergy_type
            body_location = body_location or parent.body_location
            severity = severity or parent.severity
            first_noted_date = first_noted_date or parent.first_noted_date

    obj = models.AllergyPending(
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,

        parent_allergy_id=parent_allergy_id,

        allergy_type=allergy_type,
        body_location=body_location,
        severity=severity,

        diagnosis=diagnosis,
        notes=notes,

        first_noted_date=first_noted_date,

        followup_condition=followup_condition,

        medication_name=medication_name,
        medication_start_date=medication_start_date,
        medication_end_date=medication_end_date,

        expires_at=ensure_utc(utcnow() + timedelta(hours=24)),
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj