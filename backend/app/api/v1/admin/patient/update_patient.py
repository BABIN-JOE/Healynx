#app\api\v1\admin\patient\update_patient.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
import json

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import Patient
from app.core import crypto
from app.core.audit import log_action
from app.core.auth_utils import extract_user_id

router = APIRouter()


@router.put("/patients/{patient_id}")
def update_patient(
    patient_id: str,
    data: dict,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 

    patient = db.get(Patient, patient_id)

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Editable plain fields
    allowed_plain = {
        "first_name",
        "middle_name",
        "last_name",
        "gender",
        "dob",
        "father_name",
        "mother_name",
        "blood_group",
    }

    # Editable encrypted fields
    allowed_encrypted = {
        "address": "address_encrypted",
        "phone": "phone_encrypted",
        "emergency_contact": "emergency_contact_encrypted",
        "email": "email_encrypted",
    }

    if "aadhaar" in data:
        raise HTTPException(
            status_code=400,
            detail="Aadhaar cannot be edited",
        )

    changed_fields = {}

    for key, value in data.items():

        # ------------------------
        # PLAIN FIELDS
        # ------------------------
        if key in allowed_plain:

            setattr(patient, key, value)
            changed_fields[key] = value

        # ------------------------
        # ENCRYPTED FIELDS
        # ------------------------
        elif key in allowed_encrypted:

            enc_field = allowed_encrypted[key]

            if value in (None, ""):
                setattr(patient, enc_field, None)

            else:

                if isinstance(value, dict):
                    value = json.dumps(value)

                setattr(
                    patient,
                    enc_field,
                    crypto.aesgcm_encrypt_str(value),
                )

            changed_fields[key] = "***encrypted***"

        # ------------------------
        # IGNORE UNKNOWN FIELDS
        # ------------------------
        else:
            continue

    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_action(
        db,
        action_type="admin.update_patient",
        user_role="admin",
        user_id=extract_user_id(payload),
        target_entity="patient",
        target_entity_id=patient.id,
        ip=request.client.host if request else None,
        changed_fields=changed_fields,
    )

    return {
        "message": "Patient updated successfully",
        "patient_id": str(patient.id),
    }
