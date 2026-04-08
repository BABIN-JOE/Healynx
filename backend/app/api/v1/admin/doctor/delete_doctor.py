#app/api/v1/admin/doctor/delete_doctor.py

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role 
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import Doctor
from app.core.audit import log_action

router = APIRouter()

@router.delete("/doctors/{doctor_id}")
def delete_doctor(
    doctor_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 
    doctor = db.get(Doctor, doctor_id)

    if not doctor:
        raise HTTPException(404, "Doctor not found")

    doctor.is_active = False
    db.add(doctor)
    db.commit()

    log_action(
        db,
        action_type="admin.soft_delete_doctor",
        user_role="admin",
        user_id=payload["user_id"],
        target_entity="doctors",
        target_entity_id=doctor.id
    )

    return {"message": "Doctor removed"}
