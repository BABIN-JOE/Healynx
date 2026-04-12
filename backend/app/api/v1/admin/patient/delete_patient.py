from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Patient
from app.core.audit import log_action

router = APIRouter()

@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    patient = db.get(Patient, patient_id)

    if not patient:
        raise HTTPException(404, "Patient not found")

    db.delete(patient)
    db.commit()

    log_action(
        db,
        action_type="admin.delete_patient",
        user_role="admin",
        user_id=payload["admin_id"],
        target_entity="patients",
        target_entity_id=patient_id
    )

    return {"message": "Patient deleted"}
