from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import crud
from app.db.models import DoctorRequest
from app.core.audit import log_action

router = APIRouter()

@router.post("/doctor-join-requests/{req_id}/reject")
def reject_doctor_join(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 
    hospital_id = payload["hospital_id"]

    req = db.get(DoctorRequest, req_id)
    if not req:
        raise HTTPException(404, "Request not found")

    if str(req.hospital_id) != str(hospital_id):
        raise HTTPException(403, "Request does not belong to this hospital")

    if req.status in ["approved", "hospital_rejected"]:
        raise HTTPException(400, "Invalid request status")

    if req.status != "hospital_pending":
        raise HTTPException(400, "Invalid request status")

    res = crud.hospital_reject_doctor_request(
        db, req_id, hospital_id, reviewed_by_hospital_id=hospital_id
    )

    if not res:
        raise HTTPException(500, "Failed to reject request")

    log_action(
        db,
        action_type="hospital.reject_doctor_request",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="doctor_requests",
        target_entity_id=req_id
    )

    return {"message": "Doctor request rejected"}
