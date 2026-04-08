# app/api/v1/admin/patient/list_patients.py

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Patient
from app.core.crypto import aesgcm_decrypt_str

router = APIRouter()

@router.get("/patients")
def list_patients(
    active: bool = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    offset = (page - 1) * limit

    query = select(Patient)
    if active:
        query = query.where(Patient.is_active == True)

    # ✅ total count (FIXED)
    total = db.exec(
        select(func.count()).select_from(query.subquery())
    ).one()

    # ✅ paginated data
    patients = db.exec(
        query.offset(offset).limit(limit)
    ).all()

    result = []
    for p in patients:
        result.append({
            "id": p.id,
            "first_name": p.first_name,
            "middle_name": p.middle_name,
            "last_name": p.last_name,
            "gender": p.gender,
            "dob": p.dob,
            "father_name": p.father_name,
            "mother_name": p.mother_name,
            "phone": aesgcm_decrypt_str(p.phone_encrypted),
            "email": aesgcm_decrypt_str(p.email_encrypted) if p.email_encrypted else None,
            "created_at": p.created_at,
            "is_active": p.is_active,
        })

    return {
        "data": result,
        "page": page,
        "limit": limit,
        "total": total,
    }
