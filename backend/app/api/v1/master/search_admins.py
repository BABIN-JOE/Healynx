# app/api/v1/master/search_admins.py

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

@router.get("/admins/search")
def search_admins(
    q: str,
    db = Depends(get_db),
    payload=Depends(require_role([Role.MASTER]))
):
    admins = db.query(Admin).all()
    results = []

    term = q.lower()

    for a in admins:
        email_plain = crypto.aesgcm_decrypt_str(a.email_encrypted)

        full_name = f"{a.first_name} {a.middle_name or ''} {a.last_name}".lower()

        if (
            term in full_name
            or term in a.username.lower()
            or term in email_plain.lower()
        ):
            results.append({
                "id": str(a.id),
                "first_name": a.first_name,
                "middle_name": a.middle_name,
                "last_name": a.last_name,
                "username": a.username,
                "email": email_plain
            })

    return results
