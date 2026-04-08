# app/api/v1/hospital/dashboard.py

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role

from app.db.models import (
    HospitalDoctorMap,
    DoctorRequest,
    PatientAccessRequest,
    SurgeryPending,
    AllergyPending,
    LongTermConditionPending,
    LabPending,
    ImmunizationPending,
    VisitPending,
    PatientUpdateRequest,
)

router = APIRouter()


@router.get("/dashboard-stats")
def hospital_dashboard_stats(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]

    # ------------------------------------------
    # TOTAL ACTIVE DOCTORS
    # ------------------------------------------
    total_doctors = db.exec(
        select(func.count())
        .select_from(HospitalDoctorMap)
        .where(
            HospitalDoctorMap.hospital_id == hospital_id,
            HospitalDoctorMap.is_active == True,
            HospitalDoctorMap.soft_deleted == False,
        )
    ).one()

    # ------------------------------------------
    # PENDING DOCTOR JOIN REQUESTS
    # ------------------------------------------
    pending_join_requests = db.exec(
        select(func.count())
        .select_from(DoctorRequest)
        .where(
            DoctorRequest.hospital_id == hospital_id,
            DoctorRequest.status == "hospital_pending",
        )
    ).one()

    # ------------------------------------------
    # PENDING PATIENT ACCESS REQUESTS
    # ------------------------------------------
    pending_access_requests = db.exec(
        select(func.count())
        .select_from(PatientAccessRequest)
        .where(
            PatientAccessRequest.hospital_id == hospital_id,
            PatientAccessRequest.status == "pending",
        )
    ).one()

    # ------------------------------------------
    # STRUCTURED PENDING MEDICAL ENTRIES
    # ------------------------------------------
    pending_entries = 0

    for model in [
        SurgeryPending,
        AllergyPending,
        LabPending,
        ImmunizationPending,
        VisitPending,
        LongTermConditionPending
    ]:
        count = db.exec(
            select(func.count())
            .select_from(model)
            .where(
                model.hospital_id == hospital_id,
                model.status == "pending",
            )
        ).one()

        pending_entries += int(count)

    # ------------------------------------------
    # PENDING PROFILE UPDATE REQUESTS (NEW)
    # ------------------------------------------
    pending_profile_updates = db.exec(
        select(func.count())
        .select_from(PatientUpdateRequest)
        .where(
            PatientUpdateRequest.hospital_id == hospital_id,
            PatientUpdateRequest.status == "pending",
        )
    ).one()

    # ------------------------------------------
    # FINAL RESPONSE
    # ------------------------------------------
    return {
        "totalDoctors": int(total_doctors),
        "pendingJoinRequests": int(pending_join_requests),
        "pendingAccessRequests": int(pending_access_requests),
        "pendingEntries": pending_entries,
        "pendingProfileUpdates": int(pending_profile_updates),  # ✅ NEW
    }
