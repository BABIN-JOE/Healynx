# app/db/crud/session.py

from sqlmodel import Session as DBSession, select
from app.db import models


# ---------------------------------------------------------
# CREATE SESSION
# ---------------------------------------------------------
def create_session(
    db: DBSession,
    session_id,
    role,
    expires_at,
    user_agent=None,
    ip_address=None,
    **ids
):
    s = models.Session(
        id=session_id,
        role=role,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
        revoked=False,
        **ids
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


# ---------------------------------------------------------
# GET SESSION
# ---------------------------------------------------------
def get_session(db: DBSession, session_id):
    return db.get(models.Session, session_id)


# ---------------------------------------------------------
# REVOKE SINGLE SESSION
# ---------------------------------------------------------
def revoke_session(db: DBSession, session_id):
    s = get_session(db, session_id)
    if s:
        s.revoked = True
        db.add(s)
        db.commit()


# ---------------------------------------------------------
# REVOKE ALL USER SESSIONS
# ---------------------------------------------------------
def revoke_all_user_sessions(
    db: DBSession,
    user_id=None,
    doctor_id=None,
    hospital_id=None
):
    if not any((user_id, doctor_id, hospital_id)):
        return

    q = select(models.Session)

    if user_id:
        q = q.where(models.Session.user_id == user_id)

    if doctor_id:
        q = q.where(models.Session.doctor_id == doctor_id)

    if hospital_id:
        q = q.where(models.Session.hospital_id == hospital_id)

    sessions = db.exec(q).all()

    for s in sessions:
        s.revoked = True
        db.add(s)

    db.commit()
