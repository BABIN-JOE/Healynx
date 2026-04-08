from sqlmodel import Session, select
from app.db import models


def get_patient_surgeries(db: Session, patient_id):

    surgeries = db.exec(
        select(models.Surgery)
        .where(
            models.Surgery.patient_id == patient_id,
            models.Surgery.parent_surgery_id == None
        )
        .order_by(models.Surgery.created_at.desc())
    ).all()

    results = []

    for s in surgeries:

        followups = db.exec(
            select(models.Surgery)
            .where(models.Surgery.parent_surgery_id == s.id)
            .order_by(models.Surgery.created_at.asc())
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
            "id": str(s.id),
            "surgery_name": s.surgery_name,
            "body_part": s.body_part,
            "reason": s.reason,
            "description": s.description,
            "notes": s.notes,
            "surgery_date": s.surgery_date,
            "admit_date": s.admit_date,
            "discharge_date": s.discharge_date,
            "medication_name": s.medication_name,
            "medication_start_date": s.medication_start_date,
            "medication_end_date": s.medication_end_date,
            "created_at": s.created_at,
            "followups": followup_list
        })

    return results
