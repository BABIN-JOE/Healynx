from uuid import UUID
from sqlmodel import Session, select

from app.db import models


# ---------------------------------------------------------
# Doctor Core CRUD
# ---------------------------------------------------------

def get_doctor(session: Session, doctor_id: UUID):
    return session.get(models.Doctor, doctor_id)


def get_doctor_by_id(session: Session, doctor_id: UUID):
    return get_doctor(session, doctor_id)


def get_doctor_by_license(session: Session, license_number: str):
    q = select(models.Doctor).where(
        models.Doctor.license_number == license_number
    )
    return session.exec(q).first()


def soft_delete_doctor(session: Session, doctor_id: UUID):
    d = session.get(models.Doctor, doctor_id)
    if not d:
        return None

    d.is_active = False
    session.add(d)
    session.commit()
    session.refresh(d)
    return d


def delete_doctor_permanently(session: Session, doctor_id: UUID):
    d = session.get(models.Doctor, doctor_id)
    if not d:
        return None

    session.delete(d)
    session.commit()
    return True
