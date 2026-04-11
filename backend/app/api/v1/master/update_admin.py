# app/api/v1/master/update_admin.py

from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlmodel import Session, select
import json

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.db.models import Admin
from app.core import crypto, security

router = APIRouter()

@router.put("/admins/{admin_id}")
def update_admin(
    admin_id: UUID,
    data: dict,
    db = Depends(get_db),
    payload=Depends(require_role([Role.MASTER])),
):
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(404, "Admin not found")

    # Prevent Aadhaar edits
    if "aadhaar" in data or "aadhaar_encrypted" in data or "aadhaar_hash" in data:
        raise HTTPException(400, "Aadhaar cannot be edited")

    # If username is being changed, ensure uniqueness
    if "username" in data and data["username"] != admin.username:
        q = select(Admin).where(Admin.username == data["username"])
        if db.exec(q).first():
            raise HTTPException(400, "Username already taken")

    # If phone is present, ensure uniqueness across other admins
    if "phone" in data and data["phone"]:
        new_phone_norm = crypto.normalize_phone(data["phone"])
        q = select(Admin)
        all_admins = db.exec(q).all()
        for a in all_admins:
            if str(a.id) == str(admin.id):
                continue
            if a.phone_encrypted:
                try:
                    existing_phone = crypto.aesgcm_decrypt_str(a.phone_encrypted)
                    if crypto.normalize_phone(existing_phone) == new_phone_norm:
                        raise HTTPException(400, "Phone already in use by another admin")
                except Exception:
                    pass
        # set new encrypted phone
        admin.phone_encrypted = crypto.aesgcm_encrypt_str(data["phone"])

    # If email is present, ensure uniqueness across other admins
    if "email" in data and data["email"]:
        new_email_norm = crypto.normalize_email(data["email"])
        q = select(Admin)
        all_admins = db.exec(q).all()
        for a in all_admins:
            if str(a.id) == str(admin.id):
                continue
            if a.email_encrypted:
                try:
                    existing_email = crypto.aesgcm_decrypt_str(a.email_encrypted)
                    if crypto.normalize_email(existing_email) == new_email_norm:
                        raise HTTPException(400, "Email already in use by another admin")
                except Exception:
                    pass
        # set new encrypted email
        admin.email_encrypted = crypto.aesgcm_encrypt_str(data["email"])

    # password change
    if "password" in data and data["password"]:
        admin.password_hash = security.hash_password(data["password"])

    # address update (if object), encrypt
    if "address" in data and data["address"] is not None:
        admin.address_encrypted = crypto.aesgcm_encrypt_str(json.dumps(data["address"]))

    # allowed plain updates
    allowed_plain = ("first_name", "middle_name", "last_name", "gender", "dob", "username")
    for key in allowed_plain:
        if key in data:
            setattr(admin, key, data[key])

    db.commit()
    db.refresh(admin)

    return {"message": "Admin updated", "id": str(admin.id)}
