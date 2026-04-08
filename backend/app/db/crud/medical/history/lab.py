from sqlmodel import Session, select
from app.db import models


def get_patient_lab_results(db: Session, patient_id):

    statement = (
        select(
            models.LabResult,
            models.Doctor,
            models.Hospital
        )
        .join(models.Doctor, models.LabResult.doctor_id == models.Doctor.id)
        .join(models.Hospital, models.LabResult.hospital_id == models.Hospital.id)
        .where(models.LabResult.patient_id == patient_id)
        .order_by(models.LabResult.created_at.desc())
    )

    rows = db.exec(statement).all()

    results = []

    for lab, doctor, hospital in rows:
        results.append({
            "id": str(lab.id),
            "test_name": lab.test_name,
            "body_part": lab.body_part,
            "reason": lab.reason,
            "result_text": lab.result_text,
            "notes": lab.notes,
            "test_date": lab.test_date,

            "doctor_name": doctor.name,
            "hospital_name": hospital.name,

            "created_at": lab.created_at
        })

    return results
