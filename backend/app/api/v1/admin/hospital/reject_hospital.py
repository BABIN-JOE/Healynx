from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import crud
from app.core.audit import log_action

router = APIRouter()

@router.post("/hospital-requests/{req_id}/reject")
def reject_hospital(
    req_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    req = crud.get_hospital_request(db, req_id)
    if not req:
        raise HTTPException(404, "Hospital request not found")

    if req.status == "approved":
        raise HTTPException(400, "Hospital request already approved; cannot reject")

    if req.status == "rejected":
        raise HTTPException(400, "Hospital request already rejected")

    if req.status != "pending":
        raise HTTPException(400, "Invalid request status for rejection")

    ok = crud.reject_hospital_request(
        db, req_id, reviewed_by_admin_id=payload["admin_id"]
    )

    if not ok:
        raise HTTPException(500, "Failed to reject hospital request")

    log_action(
        db,
        action_type="admin.reject_hospital",
        user_role="admin",
        user_id=payload["admin_id"],
        target_entity="hospital_requests",
        target_entity_id=req_id
    )

    return {"message": "Hospital request rejected"}
