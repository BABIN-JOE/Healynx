# app/api/v1/admin/hospital/unblock_hospital.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import Hospital
from app.core.audit import log_action

router = APIRouter()


@router.post("/hospitals/{hospital_id}/unblock", summary="Unblock hospital")
def unblock_hospital(
    hospital_id: str,
    db = Depends(get_db),
    payload = Depends(require_role([Role.ADMIN])),
    request: Request = None
):
    verify_csrf(request, db) 
    h = db.get(Hospital, hospital_id)
    if not h:
        raise HTTPException(404, "Hospital not found")
    h.is_active = True
    db.add(h)
    db.commit()
    log_action(db, action_type="admin.unblock_hospital",
               user_role="admin", user_id=payload.get("user_id"),
               target_entity="hospitals", target_entity_id=h.id,
               ip=request.client.host if request else None)
    return {"message": "Hospital unblocked"}
