from app.core.time import utcnow, ensure_utc
from datetime import datetime, timedelta
from uuid import UUID
from sqlmodel import Session
from app.db import models


def create_lab_pending(
    db: Session,
    patient_id,
    doctor_id,
    hospital_id,
    test_name,
    body_part=None,
    reason=None,
    result_text=None,
    notes=None,
    test_date=None,
):

    patient_id = UUID(str(patient_id))
    doctor_id = UUID(str(doctor_id))
    hospital_id = UUID(str(hospital_id))

    obj = models.LabPending(
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,

        test_name=test_name,
        body_part=body_part,
        reason=reason,

        result_text=result_text,
        notes=notes,

        test_date=test_date,

        expires_at=ensure_utc(utcnow() + timedelta(hours=24)),
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj
