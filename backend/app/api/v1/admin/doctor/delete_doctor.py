#app/api/v1/admin/doctor/delete_doctor.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.db.models import Allergy, Immunization, Lab, LongTermCondition, Surgery, Visit, Doctor
from app.core.audit import log_action

router = APIRouter()

@router.delete("/doctors/{doctor_id}")
def delete_doctor(
    doctor_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    doctor = db.get(Doctor, doctor_id)

    if not doctor:
        raise HTTPException(404, "Doctor not found")

    # Remove dependent medical records that reference this doctor before deleting.
    # This preserves referential integrity for hard delete.
    db.query(Visit).filter(Visit.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(Surgery).filter(Surgery.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(Allergy).filter(Allergy.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(Immunization).filter(Immunization.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(Lab).filter(Lab.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(LongTermCondition).filter(LongTermCondition.doctor_id == doctor_id).delete(synchronize_session=False)

    db.delete(doctor)
    db.commit()

    log_action(
        db,
        action_type="admin.hard_delete_doctor",
        user_role="admin",
        user_id=payload["admin_id"],
        target_entity="doctors",
        target_entity_id=doctor.id
    )

    return {"message": "Doctor deleted permanently"}
