# app/api/v1/admin/doctor/block_doctor.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import Doctor
from app.core.audit import log_action

router = APIRouter()


@router.post("/doctors/{doctor_id}/block", summary="Block doctor (soft)")
def block_doctor(
    doctor_id: str,
    db = Depends(get_db),
    payload = Depends(require_role([Role.ADMIN])),
    request: Request = None
):
    verify_csrf(request, db) 
    d = db.get(Doctor, doctor_id)
    if not d:
        raise HTTPException(404, "Doctor not found")

    d.is_active = False
    db.add(d)
    db.commit()

    log_action(
        db,
        action_type="admin.block_doctor",
        user_role="admin",
        user_id=payload.get("user_id"),
        target_entity="doctors",
        target_entity_id=d.id,
        ip=request.client.host if request else None
    )

    return {"message": "Doctor blocked"}
