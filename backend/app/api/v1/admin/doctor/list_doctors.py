from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import Optional

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.db.models import Doctor

router = APIRouter()


@router.get("/doctors", summary="List approved doctors")
def list_doctors(
    active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=300),
    db = Depends(get_db),
    payload=Depends(require_role([Role.ADMIN])),
):
    offset = (page - 1) * limit

    q = select(Doctor)

    if active is True:
        q = q.where(Doctor.is_active == True)
    elif active is False:
        q = q.where(Doctor.is_active == False)

    doctors = db.exec(
        q.offset(offset).limit(limit)
    ).all()

    result = []

    for d in doctors:
        full_name = " ".join(
            filter(None, [d.first_name, d.middle_name, d.last_name])
        )

        result.append({
            "id": str(d.id),
            "first_name": d.first_name,
            "middle_name": d.middle_name,
            "last_name": d.last_name,
            "name": full_name,
            "license_number": d.license_number,
            "specialization": d.specialization,
            "is_active": d.is_active,
            "created_at": d.created_at,
        })

    return {
        "data": result,
        "page": page,
        "limit": limit,
        "count": len(result),
    }
