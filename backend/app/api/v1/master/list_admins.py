# app/api/v1/master/list_admins.py

from fastapi import APIRouter, Depends
from sqlmodel import Session
import json

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Admin
from app.core import crypto

router = APIRouter()

@router.get("/admins/list")
def list_admins(
    db = Depends(get_db),
    payload=Depends(require_role([Role.MASTER]))
):
    admins = db.query(Admin).all()
    result = []

    for a in admins:
        addr = None
        if a.address_encrypted:
            d = crypto.aesgcm_decrypt_str(a.address_encrypted)
            try:
                addr = json.loads(d)
            except:
                addr = d

        result.append({
            "id": str(a.id),
            "first_name": a.first_name,
            "middle_name": a.middle_name,
            "last_name": a.last_name,
            "username": a.username,
            "is_active": a.is_active,
            "is_blocked": a.is_blocked,
            "email": crypto.aesgcm_decrypt_str(a.email_encrypted),
            "phone": crypto.aesgcm_decrypt_str(a.phone_encrypted),
            "address": addr,
        })

    return result
