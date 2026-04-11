# app/api/v1/admin/hospital/update_hospital.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
import json

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Hospital
from app.core import crypto
from app.core.audit import log_action

router = APIRouter()


@router.put("/hospitals/{hospital_id}")
def update_hospital(
    hospital_id: str,
    data: dict,
    payload=Depends(require_role([Role.ADMIN])),
    db: Session = Depends(get_db),
):
    hospital = db.get(Hospital, hospital_id)

    if not hospital:
        raise HTTPException(404, "Hospital not found")

    # ❌ BLOCKED FIELDS
    if "name" in data:
        raise HTTPException(400, "Hospital name cannot be edited")

    if "license_number" in data:
        raise HTTPException(400, "License cannot be edited")

    changed_fields = {}

    # ---------------------------------------------------
    # 🧠 OWNER NAME (SPLIT INTO FIELDS)
    # ---------------------------------------------------
    if "owner_name" in data:
        name = data["owner_name"].strip()

        parts = name.split()

        hospital.owner_first_name = parts[0]
        hospital.owner_last_name = parts[-1] if len(parts) > 1 else ""

        if len(parts) > 2:
            hospital.owner_middle_name = " ".join(parts[1:-1])
        else:
            hospital.owner_middle_name = None

        changed_fields["owner_name"] = name

    # ---------------------------------------------------
    # 🔐 OWNER AADHAAR (ENCRYPTED)
    # ---------------------------------------------------
    if "owner_aadhaar" in data:
        val = data["owner_aadhaar"]

        if val in (None, ""):
            raise HTTPException(400, "Aadhaar cannot be empty")

        hospital.owner_aadhaar_encrypted = crypto.aesgcm_encrypt_str(val)
        changed_fields["owner_aadhaar"] = "***encrypted***"

    # ---------------------------------------------------
    # 🔐 EMAIL
    # ---------------------------------------------------
    if "email" in data:
        val = data["email"]

        if val in (None, ""):
            hospital.email_encrypted = None
        else:
            hospital.email_encrypted = crypto.aesgcm_encrypt_str(val)

        changed_fields["email"] = "***encrypted***"

    # ---------------------------------------------------
    # 🔐 PHONE
    # ---------------------------------------------------
    if "phone" in data:
        val = data["phone"]

        if val in (None, ""):
            hospital.phone_encrypted = None
        else:
            hospital.phone_encrypted = crypto.aesgcm_encrypt_str(val)

        changed_fields["phone"] = "***encrypted***"

    # ---------------------------------------------------
    # 🔐 ADDRESS
    # ---------------------------------------------------
    if "address" in data:
        val = data["address"]

        if val in (None, {}):
            hospital.address_encrypted = None
        else:
            if isinstance(val, dict):
                val = json.dumps(val)

            hospital.address_encrypted = crypto.aesgcm_encrypt_str(val)

        changed_fields["address"] = "***encrypted***"

    # ---------------------------------------------------
    # 💾 SAVE
    # ---------------------------------------------------
    db.add(hospital)
    db.commit()
    db.refresh(hospital)

    # ---------------------------------------------------
    # 🧾 AUDIT
    # ---------------------------------------------------
    log_action(
        db,
        action_type="admin.update_hospital",
        user_role="admin",
        user_id=(
            payload.get("user_id")
            or payload.get("admin_id")
            or payload.get("master_id")
        ),
        target_entity="hospital",
        target_entity_id=hospital.id,
        ip=request.client.host if request else None,
        changed_fields=changed_fields,
    )

    return {
        "message": "Hospital updated successfully",
        "hospital_id": str(hospital.id),
    }