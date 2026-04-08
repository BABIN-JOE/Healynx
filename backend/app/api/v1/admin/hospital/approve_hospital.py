from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud
from app.core.audit import log_action

router = APIRouter()

@router.post("/hospital-requests/{req_id}/approve")
def approve_hospital(
    req_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
    request: Request = None
):
    verify_csrf(request, db) 
    req = crud.get_hospital_request(db, req_id)
    if not req:
        raise HTTPException(404, "Hospital request not found")

    if req.status == "approved":
        raise HTTPException(400, "Hospital request already approved")
    if req.status == "rejected":
        raise HTTPException(400, "Hospital request already rejected — create a new request to re-submit")
    if req.status != "pending":
        raise HTTPException(400, "Invalid request status for approval")

    hospital = crud.approve_hospital_request(
        db, req_id, approved_by_admin_id=payload["user_id"]
    )

    if not hospital:
        raise HTTPException(500, "Failed to approve hospital request")

    log_action(
        db,
        action_type="admin.approve_hospital",
        user_role="admin",
        user_id=payload["user_id"],
        target_entity="hospitals",
        target_entity_id=hospital.id,
        ip=request.client.host if request else None
    )

    return {"hospital_id": str(hospital.id)}
