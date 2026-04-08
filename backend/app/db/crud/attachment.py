from sqlmodel import Session
from app.db import models


def create_attachment(session: Session, **kwargs):
    a = models.Attachment(**kwargs)
    session.add(a)
    session.commit()
    session.refresh(a)
    return a
