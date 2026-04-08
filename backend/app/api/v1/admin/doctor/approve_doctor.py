from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role 
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud
from app.core.audit import log_action

router = APIRouter()

@router.post("/doctor-requests/{req_id}/approve")
def approve_doctor(
    req_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
    request: Request = None
):
    verify_csrf(request, db) 
    req = crud.get_doctor_request(db, req_id)

    if not req:
        raise HTTPException(404, "Doctor request not found")

    if req.status == "approved":
        raise HTTPException(400, "Doctor request already approved")

    if req.status == "rejected":
        raise HTTPException(400, "Doctor request already rejected — ask the applicant to re-submit")

    if req.status != "pending":
        raise HTTPException(
            400,
            "Admin can only approve self-registered doctor requests (pending). "
            "Hospital join requests must be approved by hospitals."
        )

    doctor = crud.approve_doctor_request(
        db, req_id, approved_by_admin_id=payload["user_id"]
    )

    if not doctor:
        raise HTTPException(500, "Failed to approve doctor request")

    log_action(
        db,
        action_type="admin.approve_doctor",
        user_role="admin",
        user_id=payload["user_id"],
        target_entity="doctors",
        target_entity_id=doctor.id,
        ip=request.client.host if request else None
    )

    return {"doctor_id": str(doctor.id)}
