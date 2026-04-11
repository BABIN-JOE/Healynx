from sqlmodel import Session, select
from app.db import models


def create_refresh_token(db: Session, **kwargs):
    rt = models.RefreshToken(**kwargs)
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt


def get_refresh_token(db: Session, token_hash: str):
    q = select(models.RefreshToken).where(
        models.RefreshToken.token_hash == token_hash
    )
    return db.exec(q).first()


def revoke_refresh_token(db: Session, token_hash: str):
    rt = get_refresh_token(db, token_hash)
    if rt:
        rt.revoked = True
        db.add(rt)
        db.commit()


def revoke_all_user_tokens(db: Session, doctor_id=None, user_id=None, hospital_id=None):
    if not any((doctor_id, user_id, hospital_id)):
        return

    q = select(models.RefreshToken)

    if doctor_id:
        q = q.where(models.RefreshToken.doctor_id == doctor_id)

    if user_id:
        q = q.where(models.RefreshToken.user_id == user_id)

    if hospital_id:
        q = q.where(models.RefreshToken.hospital_id == hospital_id)

    tokens = db.exec(q).all()

    for t in tokens:
        t.revoked = True
        db.add(t)

    db.commit()
