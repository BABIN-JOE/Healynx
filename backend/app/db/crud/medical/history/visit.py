from sqlmodel import Session, select
from app.db import models


def get_patient_visits(db: Session, patient_id):

    visits = db.exec(
        select(models.Visit)
        .where(
            models.Visit.patient_id == patient_id,
            models.Visit.parent_visit_id == None
        )
        .order_by(models.Visit.visit_date.desc())
    ).all()

    results = []

    for v in visits:

        followups = db.exec(
            select(models.Visit)
            .where(models.Visit.parent_visit_id == v.id)
            .order_by(models.Visit.visit_date.asc())
        ).all()

        followup_list = []

        for f in followups:
            followup_list.append({
                "id": str(f.id),
                "visit_date": f.visit_date,
                "condition": f.followup_condition,
                "notes": f.notes,
            })

        results.append({
            "id": str(v.id),
            "visit_date": v.visit_date,
            "chief_complaint": v.chief_complaint,
            "diagnosis": v.diagnosis,
            "notes": v.notes,
            "created_at": v.created_at,
            "followups": followup_list
        })

    return results
