from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
import json

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import Doctor
from app.core import crypto
from app.core.audit import log_action

router = APIRouter()


@router.put("/doctors/{doctor_id}")
def update_doctor(
    doctor_id: str,
    data: dict,
    payload=Depends(require_role([Role.ADMIN])),
    db: Session = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db)

    doctor = db.get(Doctor, doctor_id)

    if not doctor:
        raise HTTPException(404, "Doctor not found")

    # ❌ BLOCKED
    if "license_number" in data:
        raise HTTPException(400, "License cannot be edited")

    if "aadhaar" in data:
        raise HTTPException(400, "Aadhaar cannot be edited")

    # ✅ PLAIN FIELDS
    allowed_plain = {
        "first_name",
        "middle_name",
        "last_name",
        "gender",
        "dob",
        "specialization",
    }

    # 🔐 ENCRYPTED FIELDS
    allowed_encrypted = {
        "email": "email_encrypted",
        "phone": "phone_encrypted",
        "address": "address_encrypted",
    }

    changed_fields = {}

    for key, value in data.items():

        # --------- PLAIN ----------
        if key in allowed_plain:
            setattr(doctor, key, value)
            changed_fields[key] = value

        # --------- ENCRYPTED ----------
        elif key in allowed_encrypted:

            enc_field = allowed_encrypted[key]

            if value in (None, ""):
                setattr(doctor, enc_field, None)
            else:
                if isinstance(value, dict):
                    value = json.dumps(value)

                setattr(
                    doctor,
                    enc_field,
                    crypto.aesgcm_encrypt_str(value),
                )

            changed_fields[key] = "***encrypted***"

        else:
            continue

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    log_action(
        db,
        action_type="admin.update_doctor",
        user_role="admin",
        user_id = (
            payload.get("user_id")
            or payload.get("admin_id")
            or payload.get("master_id")
        ),
        target_entity="doctor",
        target_entity_id=doctor.id,
        ip=request.client.host if request else None,
        changed_fields=changed_fields,
    )

    return {
        "message": "Doctor updated successfully",
        "doctor_id": str(doctor.id),
    }