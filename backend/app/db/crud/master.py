from sqlmodel import Session, select
from app.db import models


def create_master(session: Session, **kwargs):
    obj = models.Master(**kwargs)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def get_master_by_username(session: Session, username: str):
    q = select(models.Master).where(models.Master.username == username)
    return session.exec(q).first()
