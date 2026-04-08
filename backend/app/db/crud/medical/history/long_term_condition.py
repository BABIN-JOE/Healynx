from sqlmodel import Session, select
from app.db import models


def get_patient_long_term_conditions(db: Session, patient_id):

    conditions = db.exec(
        select(models.LongTermCondition)
        .where(
            models.LongTermCondition.patient_id == patient_id,
            models.LongTermCondition.parent_condition_id == None
        )
        .order_by(models.LongTermCondition.created_at.desc())
    ).all()

    results = []

    for c in conditions:

        followups = db.exec(
            select(models.LongTermCondition)
            .where(models.LongTermCondition.parent_condition_id == c.id)
            .order_by(models.LongTermCondition.created_at.asc())
        ).all()

        followup_list = []

        for f in followups:
            followup_list.append({
                "id": str(f.id),
                "current_condition": f.current_condition,
                "diagnosis": f.diagnosis,
                "notes": f.notes,
                "medication_name": f.medication_name,
                "medication_start_date": f.medication_start_date,
                "medication_end_date": f.medication_end_date,
                "created_at": f.created_at
            })

        results.append({
            "id": str(c.id),
            "condition_name": c.condition_name,
            "first_noted_date": c.first_noted_date,
            "current_condition": c.current_condition,
            "diagnosis": c.diagnosis,
            "notes": c.notes,
            "medication_name": c.medication_name,
            "medication_start_date": c.medication_start_date,
            "medication_end_date": c.medication_end_date,
            "created_at": c.created_at,
            "followups": followup_list
        })

    return results
