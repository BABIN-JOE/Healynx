from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud
from app.core.audit import log_action
from app.core.auth_utils import extract_user_id

router = APIRouter()


@router.post("/hospital-requests/{req_id}/approve")
def approve_hospital(
    req_id: str,
    request: Request,
    payload=Depends(require_role([Role.ADMIN])),
    db: Session = Depends(get_db),
):
    # CSRF validation
    verify_csrf(request, db)

    req = crud.get_hospital_request(db, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Hospital request not found")

    if req.status == "approved":
        raise HTTPException(status_code=400, detail="Hospital request already approved")

    if req.status == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Hospital request already rejected — create a new request to re-submit"
        )

    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Invalid request status for approval")

    admin_id = extract_user_id(payload)

    hospital = crud.approve_hospital_request(
        db,
        req_id,
        approved_by_admin_id=admin_id,
    )

    if not hospital:
        raise HTTPException(status_code=500, detail="Failed to approve hospital request")

    log_action(
        db,
        action_type="admin.approve_hospital",
        user_role="admin",
        user_id=admin_id,
        target_entity="hospitals",
        target_entity_id=str(hospital.id),
        ip=request.client.host if request else None,
    )

    return {
        "message": "Hospital approved successfully",
        "hospital_id": str(hospital.id),
    }