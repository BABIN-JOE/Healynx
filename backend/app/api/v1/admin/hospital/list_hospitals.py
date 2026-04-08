# app/api/v1/admin/hospital/list_hospitals.py

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import Optional
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Hospital
from app.core.crypto import aesgcm_decrypt_str
import json

router = APIRouter()

@router.get("/hospitals", summary="List approved hospitals")
def list_hospitals(
    active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=300),
    db = Depends(get_db),
    payload = Depends(require_role([Role.ADMIN]))
):

    q = select(Hospital).where(Hospital.is_active == active)

    items = db.exec(q).all()
    result = []

    for h in items:

        # decrypt address
        address = None
        if h.address_encrypted:
            try:
                decrypted = aesgcm_decrypt_str(h.address_encrypted)
                address = json.loads(decrypted)
            except:
                address = None

        # return clean and correct structure
        result.append({
            "id": h.id,
            "hospital_name": h.hospital_name,
            "license_number": h.license_number,

            # owner name fields (correct fields)
            "owner_first_name": h.owner_first_name,
            "owner_middle_name": h.owner_middle_name,
            "owner_last_name": h.owner_last_name,

            # hide encrypted PII
            "email": None,
            "phone": None,
            "owner_aadhaar": None,

            "address": address,
            "is_active": h.is_active,
        })

    return {
        "data": result,
        "page": page,
        "limit": limit,
        "total": len(result),
    }
