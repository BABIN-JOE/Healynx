from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Hospital
from app.core.audit import log_action

router = APIRouter()

@router.delete("/hospitals/{hospital_id}")
def delete_hospital(
    hospital_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    hospital = db.get(Hospital, hospital_id)

    if not hospital:
        raise HTTPException(404, "Hospital not found")

    hospital.is_active = False
    db.add(hospital)
    db.commit()

    log_action(
        db,
        action_type="admin.soft_delete_hospital",
        user_role="admin",
        user_id=payload["user_id"],
        target_entity="hospitals",
        target_entity_id=hospital.id
    )

    return {"message": "Hospital removed"}
