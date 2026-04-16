#app/api/v1/admin/doctor/delete_doctor.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.db.models import (
    Allergy,
    AllergyPending,
    HospitalDoctorMap,
    Immunization,
    LabResult,
    LongTermCondition,
    LongTermConditionPending,
    Surgery,
    SurgeryPending,
    Visit,
    Doctor,
)
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

    # Delete pending records that reference approved doctor records first.
    surgery_ids = [s.id for s in db.query(Surgery).filter(Surgery.doctor_id == doctor_id).all()]
    if surgery_ids:
        db.query(SurgeryPending).filter(SurgeryPending.parent_surgery_id.in_(surgery_ids)).delete(synchronize_session=False)

    allergy_ids = [a.id for a in db.query(Allergy).filter(Allergy.doctor_id == doctor_id).all()]
    if allergy_ids:
        db.query(AllergyPending).filter(AllergyPending.parent_allergy_id.in_(allergy_ids)).delete(synchronize_session=False)

    condition_ids = [c.id for c in db.query(LongTermCondition).filter(LongTermCondition.doctor_id == doctor_id).all()]
    if condition_ids:
        db.query(LongTermConditionPending).filter(LongTermConditionPending.parent_condition_id.in_(condition_ids)).delete(synchronize_session=False)

    # Remove approved medical records that reference this doctor.
    db.query(Visit).filter(Visit.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(Surgery).filter(Surgery.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(Allergy).filter(Allergy.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(Immunization).filter(Immunization.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(LabResult).filter(LabResult.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(LongTermCondition).filter(LongTermCondition.doctor_id == doctor_id).delete(synchronize_session=False)
    db.query(HospitalDoctorMap).filter(HospitalDoctorMap.doctor_id == doctor_id).delete(synchronize_session=False)

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
