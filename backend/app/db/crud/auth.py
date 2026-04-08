from uuid import UUID
from sqlmodel import Session
from app.db import models


def update_doctor_password(
    session: Session,
    doctor_id: UUID,
    new_hash: str
):
    doc = session.get(models.Doctor, doctor_id)
    if not doc:
        return None

    doc.password_hash = new_hash
    session.add(doc)
    session.commit()
    session.refresh(doc)   # ✅ good practice

    return doc


def update_hospital_password(
    session: Session,
    hospital_id: UUID,
    new_hash: str
):
    hospital = session.get(models.Hospital, hospital_id)
    if not hospital:
        return None

    hospital.password_hash = new_hash
    session.add(hospital)
    session.commit()
    session.refresh(hospital)   # ✅ good practice

    return hospital
