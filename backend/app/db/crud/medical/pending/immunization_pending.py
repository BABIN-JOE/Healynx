from app.core.time import entry_expiry_time
from sqlmodel import Session
from app.db import models
from uuid import UUID


def create_immunization_pending(
    db: Session,
    patient_id,
    doctor_id,
    hospital_id,
    vaccine_name,
    vaccination_date,
    reason=None,
    dosage=None,
    notes=None,
):

    patient_id = UUID(str(patient_id))
    doctor_id = UUID(str(doctor_id))
    hospital_id = UUID(str(hospital_id))

    obj = models.ImmunizationPending(
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,

        vaccine_name=vaccine_name,
        vaccination_date=vaccination_date,

        reason=reason,
        dosage=dosage,
        notes=notes,

        expires_at=entry_expiry_time(),
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj
