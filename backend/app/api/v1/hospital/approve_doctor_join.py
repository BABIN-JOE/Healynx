from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import crud
from app.db.models import DoctorRequest
from app.core.audit import log_action

router = APIRouter()

@router.post("/doctor-join-requests/{req_id}/approve")
def approve_doctor_join(
    req_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]

    req = db.get(DoctorRequest, req_id)
    if not req:
        raise HTTPException(404, "Request not found")

    if str(req.hospital_id) != str(hospital_id):
        raise HTTPException(403, "Request does not belong to this hospital")

    if req.status not in ["hospital_pending"]:
        raise HTTPException(400, "Invalid request status")

    doctor = crud.hospital_approve_doctor_request(
        db, req_id, hospital_id, approved_by_hospital_id=hospital_id
    )

    if not doctor:
        raise HTTPException(400, "Unable to approve — doctor may already belong to another hospital")

    log_action(
        db,
        action_type="hospital.approve_doctor_request",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="doctor_requests",
        target_entity_id=req_id
    )

    return {
        "message": "Doctor joined hospital successfully",
        "doctor_id": str(doctor.id)
    }
