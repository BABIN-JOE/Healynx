# app/api/v1/master/get_admin.py

from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlmodel import Session
import json

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Admin
from app.core import crypto

router = APIRouter()

@router.get("/admins/{admin_id}")
def get_admin(
    admin_id: UUID,
    db = Depends(get_db),
    payload=Depends(require_role([Role.MASTER]))
):
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(404, "Admin not found")

    address_plain = None
    if admin.address_encrypted:
        try:
            decrypted = crypto.aesgcm_decrypt_str(admin.address_encrypted)
            try:
                address_plain = json.loads(decrypted)
            except:
                address_plain = decrypted
        except Exception:
            address_plain = None

    # decrypt contact fields where present
    email_plain = None
    phone_plain = None
    aadhaar_plain = None

    try:
        if admin.email_encrypted:
            email_plain = crypto.aesgcm_decrypt_str(admin.email_encrypted)
    except Exception:
        email_plain = None

    try:
        if admin.phone_encrypted:
            phone_plain = crypto.aesgcm_decrypt_str(admin.phone_encrypted)
    except Exception:
        phone_plain = None

    try:
        if getattr(admin, "aadhaar_encrypted", None):
            aadhaar_plain = crypto.aesgcm_decrypt_str(admin.aadhaar_encrypted)
    except Exception:
        aadhaar_plain = None

    return {
        "id": str(admin.id),
        "first_name": admin.first_name,
        "middle_name": admin.middle_name,
        "last_name": admin.last_name,
        "gender": admin.gender,
        "dob": admin.dob,
        "username": admin.username,
        "is_active": admin.is_active,
        "is_blocked": admin.is_blocked,
        "email": email_plain,
        "phone": phone_plain,
        "address": address_plain,
        "aadhaar": aadhaar_plain,
        "created_at": admin.created_at
    }
