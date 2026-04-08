from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import Optional

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Patient
from app.core.crypto import aesgcm_decrypt_str

router = APIRouter()


@router.get("/patients/search", summary="Search patients by name, phone, email, aadhaar")
def search_patients(
    q: Optional[str] = Query(None, description="Search keyword"),
    db = Depends(get_db),
    payload=Depends(require_role([Role.ADMIN]))
):
    if not q:
        return {"total": 0, "items": []}

    patients = db.exec(select(Patient)).all()
    results = []

    for p in patients:
        name = " ".join(filter(None, [p.first_name, p.middle_name, p.last_name]))
        phone = aesgcm_decrypt_str(p.phone_encrypted) if p.phone_encrypted else ""
        email = aesgcm_decrypt_str(p.email_encrypted) if p.email_encrypted else ""
        aadhaar = aesgcm_decrypt_str(p.aadhaar_encrypted) if p.aadhaar_encrypted else ""

        if (
            q.lower() in name.lower()
            or q in phone
            or q in email
            or q in aadhaar
        ):
            results.append({
                "id": str(p.id),
                "name": name,
                "phone": phone,
                "email": email,
                "aadhaar": aadhaar,
                "is_active": p.is_active
            })

    return {
        "total": len(results),
        "items": results
    }
