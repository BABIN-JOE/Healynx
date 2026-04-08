from sqlmodel import Session, select
from app.db import models


def get_patient_allergies(db: Session, patient_id):

    allergies = db.exec(
        select(models.Allergy)
        .where(
            models.Allergy.patient_id == patient_id,
            models.Allergy.parent_allergy_id == None
        )
        .order_by(models.Allergy.created_at.desc())
    ).all()

    results = []

    for a in allergies:

        followups = db.exec(
            select(models.Allergy)
            .where(models.Allergy.parent_allergy_id == a.id)
            .order_by(models.Allergy.created_at.asc())
        ).all()

        followup_list = []

        for f in followups:
            followup_list.append({
                "id": str(f.id),
                "followup_condition": f.followup_condition,
                "notes": f.notes,
                "medication_name": f.medication_name,
                "medication_start_date": f.medication_start_date,
                "medication_end_date": f.medication_end_date,
                "created_at": f.created_at
            })

        results.append({
            "id": str(a.id),
            "allergy_type": a.allergy_type,
            "body_location": a.body_location,
            "severity": a.severity,
            "first_noted_date": a.first_noted_date,
            "diagnosis": a.diagnosis,
            "notes": a.notes,
            "medication_name": a.medication_name,
            "medication_start_date": a.medication_start_date,
            "medication_end_date": a.medication_end_date,
            "created_at": a.created_at,
            "followups": followup_list
        })

    return results
