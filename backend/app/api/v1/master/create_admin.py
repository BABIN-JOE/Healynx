# app/api/v1/master/create_admin.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.schemas import MasterCreate
from app.core import crypto, security
from app.db import crud
from app.core.audit import log_action
from app.db.models import Admin  # for duplicate checks
import json

router = APIRouter()


@router.post("/admins/create")
def create_admin(
    body: MasterCreate,
    payload=Depends(require_role([Role.MASTER])),
    db = Depends(get_db),
):
    # Aadhaar: compute hash and encrypted blob
    aadhaar_hash = crypto.aadhaar_hash_hex(body.aadhaar)
    aadhaar_encrypted = crypto.aesgcm_encrypt_str(body.aadhaar)

    # Username uniqueness check
    existing_user = crud.get_admin_by_username(db, body.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Aadhaar uniqueness (use aadhaar_hash field if present on model)
    q = select(Admin).where(Admin.aadhaar_hash == aadhaar_hash)
    if db.exec(q).first():
        raise HTTPException(status_code=400, detail="An admin with this Aadhaar already exists")

    # Phone & email: normalize and ensure not used by another admin
    phone_norm = crypto.normalize_phone(body.phone)
    email_norm = crypto.normalize_email(body.email)

    if phone_norm:
        # scan existing admins and decrypt phones to compare (no phone_hash column present)
        q = select(Admin)
        all_admins = db.exec(q).all()
        for a in all_admins:
            if a.phone_encrypted:
                try:
                    existing_phone = crypto.aesgcm_decrypt_str(a.phone_encrypted)
                    if crypto.normalize_phone(existing_phone) == phone_norm:
                        raise HTTPException(status_code=400, detail="Phone number already in use by another admin")
                except Exception:
                    # ignore decrypt errors but warn in logs (do not block)
                    pass

    if email_norm:
        q = select(Admin)
        all_admins = db.exec(q).all()
        for a in all_admins:
            if a.email_encrypted:
                try:
                    existing_email = crypto.aesgcm_decrypt_str(a.email_encrypted)
                    if crypto.normalize_email(existing_email) == email_norm:
                        raise HTTPException(status_code=400, detail="Email already in use by another admin")
                except Exception:
                    pass

    # Encrypt phone/email for storage
    phone_encrypted = crypto.aesgcm_encrypt_str(body.phone) if body.phone else None
    email_encrypted = crypto.aesgcm_encrypt_str(body.email) if body.email else None

    # Address object (we pass address_obj to crud which will handle encryption)
    address_obj = body.address.model_dump()

    # Password hash
    password_hash = security.hash_password(body.password)

    # CREATE ADMIN
    try:
        admin = crud.create_admin(
            session=db,
            first_name=body.first_name,
            middle_name=body.middle_name,
            last_name=body.last_name,
            gender=body.gender,
            dob=body.dob,
            aadhaar_hash=aadhaar_hash,
            aadhaar_encrypted=aadhaar_encrypted,
            phone_encrypted=phone_encrypted,
            email_encrypted=email_encrypted,
            address_obj=address_obj,
            username=body.username,
            password_hash=password_hash,
            created_by=payload.get("user_id")
        )
    except ValueError as e:
        # propagate meaningful crud-level ValueErrors as 400
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # generic
        raise HTTPException(status_code=500, detail="Failed to create admin")

    # Logging
    log_action(
        db,
        action_type="master.create_admin",
        user_role="master",
        user_id=payload.get("user_id"),
        target_entity="admin",
        target_entity_id=str(admin.id),
        ip=request.client.host if request else None
    )

    return {"id": str(admin.id), "message": "Admin created successfully"}
