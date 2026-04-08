from app.core.time import utcnow
from sqlmodel import Session, select
from app.db import models
from datetime import datetime

pending_models = [
    models.VisitPending,
    models.SurgeryPending,
    models.AllergyPending,
    models.LabPending,
    models.ImmunizationPending,
    models.LongTermConditionPending,
]

def expire_old_pending_entries(db):
    now = utcnow()

    for model in pending_models:
        rows = db.exec(
            select(model).where(
                model.status == "pending",
                model.expires_at < now
            )
        ).all()

        for r in rows:
            r.status = "expired"
            db.add(r)

    db.commit()
