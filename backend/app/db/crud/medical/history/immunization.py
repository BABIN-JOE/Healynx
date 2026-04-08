from sqlmodel import Session, select
from app.db import models


def get_patient_immunizations(db: Session, patient_id):

    statement = (
        select(
            models.Immunization,
            models.Doctor,
            models.Hospital
        )
        .join(models.Doctor, models.Immunization.doctor_id == models.Doctor.id)
        .join(models.Hospital, models.Immunization.hospital_id == models.Hospital.id)
        .where(models.Immunization.patient_id == patient_id)
        .order_by(models.Immunization.created_at.desc())
    )

    rows = db.exec(statement).all()

    results = []

    for immunization, doctor, hospital in rows:
        results.append({
            "id": str(immunization.id),
            "vaccine_name": immunization.vaccine_name,
            "reason": immunization.reason,
            "dosage": immunization.dosage,
            "vaccination_date": immunization.vaccination_date,
            "notes": immunization.notes,

            "doctor_name": doctor.name,
            "hospital_name": hospital.name,

            "created_at": immunization.created_at,
        })

    return results
