from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import crud
from app.core.audit import log_action

router = APIRouter()

@router.post("/doctor-requests/{req_id}/reject")
def reject_doctor(
    req_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    req = crud.get_doctor_request(db, req_id)

    if not req:
        raise HTTPException(404, "Doctor request not found")

    if req.status == "approved":
        raise HTTPException(400, "Doctor request already approved; cannot reject")

    if req.status == "rejected":
        raise HTTPException(400, "Doctor request already rejected")

    if req.status != "pending":
        raise HTTPException(400, "Admin can only reject pending doctor requests")

    ok = crud.reject_doctor_request(
        db, req_id, reviewed_by_admin_id=payload["admin_id"]
    )

    if not ok:
        raise HTTPException(500, "Failed to reject doctor request")

    log_action(
        db,
        action_type="admin.reject_doctor",
        user_role="admin",
        user_id=payload["admin_id"],
        target_entity="doctor_requests",
        target_entity_id=req_id
    )

    return {"message": "Doctor request rejected"}
