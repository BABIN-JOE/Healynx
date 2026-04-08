from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from uuid import UUID

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Patient
from app.core import crypto

router = APIRouter()


@router.get("/patients/{patient_id}")
def get_patient(
    patient_id: UUID,
    db = Depends(get_db),
    payload=Depends(require_role([Role.ADMIN])),
):

    patient = db.get(Patient, patient_id)

    if not patient or not patient.is_active:
        raise HTTPException(status_code=404, detail="Patient not found")

    return {
        "id": str(patient.id),
        "first_name": patient.first_name,
        "middle_name": patient.middle_name,
        "last_name": patient.last_name,
        "gender": patient.gender,
        "dob": patient.dob,
        "blood_group": patient.blood_group,
        "father_name": patient.father_name,
        "mother_name": patient.mother_name,

        "phone": crypto.aesgcm_decrypt_str(patient.phone_encrypted)
        if patient.phone_encrypted else None,

        "emergency_contact": crypto.aesgcm_decrypt_str(
            patient.emergency_contact_encrypted
        ) if patient.emergency_contact_encrypted else None,

        "email": crypto.aesgcm_decrypt_str(patient.email_encrypted)
        if patient.email_encrypted else None,

        "address": crypto.aesgcm_decrypt_str(patient.address_encrypted)
        if patient.address_encrypted else None,

        "created_at": patient.created_at,
        "is_active": patient.is_active,
    }
