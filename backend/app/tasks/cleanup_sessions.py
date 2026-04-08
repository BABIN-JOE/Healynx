# app/tasks/cleanup_sessions.py

from app.core.time import utcnow
from sqlmodel import delete
from app.db import models


def cleanup_expired_sessions(db):

    now = utcnow()

    # 🔥 CLEAN PATIENT ACCESS SESSIONS
    db.exec(
        delete(models.PatientAccessSession).where(
            models.PatientAccessSession.view_expires_at <= now,
            models.PatientAccessSession.entry_expires_at <= now
        )
    )

    # 🔥 CLEAN AUTH SESSIONS (NEW)
    db.exec(
        delete(models.Session).where(
            models.Session.expires_at < now
        )
    )

    db.commit()