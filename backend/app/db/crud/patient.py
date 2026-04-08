from typing import Optional
from uuid import UUID
from sqlmodel import Session, select
from datetime import datetime
from app.db import models
from app.core import crypto


def create_patient(
    session: Session,
    first_name: str,
    last_name: str,
    middle_name: Optional[str] = None,
    gender: Optional[str] = None,
    dob: Optional[str] = None,
    father_name: Optional[str] = None,
    mother_name: Optional[str] = None,
    address_obj: Optional[dict] = None,
    address_encrypted: Optional[bytes] = None,
    phone_encrypted: Optional[bytes] = None,
    emergency_contact_encrypted: bytes = None,
    email_encrypted: Optional[bytes] = None,
    aadhaar_encrypted: bytes = None,
    aadhaar_hash: str = None,
    created_by: Optional[UUID] = None,
    blood_group: str = None,
    **kwargs
):
    addr_blob = None
    if address_obj is not None:
        import json
        addr_blob = crypto.aesgcm_encrypt_str(json.dumps(address_obj))
    elif address_encrypted is not None:
        addr_blob = address_encrypted

    obj = models.Patient(
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        gender=gender,
        dob=dob,
        father_name=father_name,
        mother_name=mother_name,
        address_encrypted=addr_blob,
        phone_encrypted=phone_encrypted,
        emergency_contact_encrypted=emergency_contact_encrypted,
        email_encrypted=email_encrypted,
        aadhaar_encrypted=aadhaar_encrypted,
        aadhaar_hash=aadhaar_hash,
        created_by=created_by,
        blood_group=blood_group,
        **kwargs
    )

    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def get_patient_by_aadhaar_hash(session: Session, h: str):
    q = select(models.Patient).where(models.Patient.aadhaar_hash == h)
    return session.exec(q).first()

def get_patient_by_id(session: Session, patient_id):
    return session.get(models.Patient, patient_id)  


def get_patient(session: Session, patient_id: UUID):
    return session.get(models.Patient, patient_id)


def update_patient(session: Session, patient_id: UUID, **fields):
    p = session.get(models.Patient, patient_id)
    if not p:
        return None

    if "address_obj" in fields:
        import json
        p.address_encrypted = crypto.aesgcm_encrypt_str(
            json.dumps(fields.pop("address_obj"))
        )

    for k, v in fields.items():
        if hasattr(p, k):
            setattr(p, k, v)
            if "emergency_contact" in fields:
                p.emergency_contact_encrypted = crypto.aesgcm_encrypt_str(
                    fields.pop("emergency_contact")
                )

    session.add(p)
    session.commit()
    session.refresh(p)
    return p
