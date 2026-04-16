from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import (
    Allergy,
    AllergyPending,
    Hospital,
    HospitalDoctorMap,
    Immunization,
    ImmunizationPending,
    LabPending,
    LabResult,
    LongTermCondition,
    LongTermConditionPending,
    Surgery,
    SurgeryPending,
    Visit,
    VisitPending,
)
from app.core.audit import log_action

router = APIRouter()

@router.delete("/hospitals/{hospital_id}")
def delete_hospital(
    hospital_id: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    hospital = db.get(Hospital, hospital_id)

    if not hospital:
        raise HTTPException(404, "Hospital not found")

    # Remove pending medical records for this hospital first.
    db.query(VisitPending).filter(VisitPending.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(SurgeryPending).filter(SurgeryPending.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(AllergyPending).filter(AllergyPending.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(ImmunizationPending).filter(ImmunizationPending.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(LabPending).filter(LabPending.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(LongTermConditionPending).filter(LongTermConditionPending.hospital_id == hospital_id).delete(synchronize_session=False)

    # Remove approved medical records that reference this hospital.
    db.query(Visit).filter(Visit.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(Surgery).filter(Surgery.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(Allergy).filter(Allergy.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(Immunization).filter(Immunization.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(LabResult).filter(LabResult.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(LongTermCondition).filter(LongTermCondition.hospital_id == hospital_id).delete(synchronize_session=False)
    db.query(HospitalDoctorMap).filter(HospitalDoctorMap.hospital_id == hospital_id).delete(synchronize_session=False)

    db.delete(hospital)
    db.commit()

    log_action(
        db,
        action_type="admin.hard_delete_hospital",
        user_role="admin",
        user_id=payload["admin_id"],
        target_entity="hospitals",
        target_entity_id=hospital.id
    )

    return {"message": "Hospital deleted permanently"}
