from sqlmodel import Session
from app.db import models


def create_audit_log(session: Session, **kwargs):
    al = models.AuditLog(**kwargs)
    session.add(al)
    session.commit()
    session.refresh(al)
    return al
