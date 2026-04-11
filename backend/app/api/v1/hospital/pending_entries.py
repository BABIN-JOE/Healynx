from app.core.time import calculate_age, is_expired, parse_date_string, utcnow
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import models, crud
from app.core.audit import log_action

router = APIRouter(
    prefix="/medical/entries/pending",
    tags=["Hospital Medical"]
)

# -------------------------------------------------------------------
# Pending Models
# -------------------------------------------------------------------
PENDING_MODELS = [
    models.VisitPending,
    models.SurgeryPending,
    models.LabPending,
    models.ImmunizationPending,
    models.AllergyPending,
    models.LongTermConditionPending,
]

# -------------------------------------------------------------------
# LIST ALL PENDING ENTRIES
# -------------------------------------------------------------------
@router.get("/")
def list_pending_entries(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]
    now = utcnow()

    results = []

    for model in PENDING_MODELS:

        rows = db.exec(
            select(model)
            .where(
                model.hospital_id == hospital_id,
                model.status == "pending"
            )
            .order_by(model.created_at.desc())
        ).all()

        for r in rows:

            # Auto-expire
            if is_expired(r.expires_at):
                r.status = "expired"
                db.add(r)
                db.commit()
                continue

            patient = db.exec(
                select(models.Patient).where(
                    models.Patient.id == r.patient_id
                )
            ).first()

            doctor = db.exec(
                select(models.Doctor).where(
                    models.Doctor.id == r.doctor_id
                )
            ).first()

            patient_name = None
            doctor_name = None

            if patient:
                first = getattr(patient, "first_name", "")
                last = getattr(patient, "last_name", "")
                patient_name = f"{first} {last}".strip()

            if doctor:
                first = getattr(doctor, "first_name", "")
                last = getattr(doctor, "last_name", "")
                doctor_name = f"Dr. {first} {last}".strip()

            results.append({
                "id": str(r.id),
                "entry_type": model.__name__.replace("Pending", "").lower(),

                "doctor_id": str(r.doctor_id),
                "patient_id": str(r.patient_id),

                "doctor_name": doctor_name,
                "patient_name": patient_name,

                "created_at": r.created_at,
                "expires_at": r.expires_at,
                "status": r.status,
            })

    results.sort(key=lambda x: x["created_at"], reverse=True)
    return results


# -------------------------------------------------------------------
# VIEW PENDING ENTRY DETAILS
# -------------------------------------------------------------------
@router.get("/{pending_id}")
def get_pending_entry(
    pending_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):

    for model in PENDING_MODELS:

        obj = db.exec(
            select(model).where(model.id == pending_id)
        ).first()

        if obj:

            # -------------------------
            # Patient
            # -------------------------
            patient = db.exec(
                select(models.Patient).where(
                    models.Patient.id == obj.patient_id
                )
            ).first()

            patient_name = None
            patient_age = None
            patient_gender = None

            if patient:

                patient_name = f"{patient.first_name} {patient.last_name}"
                patient_gender = patient.gender

                patient_age = None

                if patient and patient.dob:
                    try:
                        dob = parse_date_string(patient.dob)
                        patient_age = calculate_age(dob)
                    except Exception:
                        patient_age = None

            # -------------------------
            # Doctor
            # -------------------------
            doctor = db.exec(
                select(models.Doctor).where(
                    models.Doctor.id == obj.doctor_id
                )
            ).first()

            doctor_name = None

            if doctor:
                first = getattr(doctor, "first_name", "")
                last = getattr(doctor, "last_name", "")
                doctor_name = f"Dr. {first} {last}".strip()

            # -------------------------
            # Entry Type
            # -------------------------
            entry_type = model.__name__.replace("Pending", "").lower()

            # -------------------------
            # Final Response
            # -------------------------
            data = obj.model_dump()

            data.update({
                "type": entry_type,
                "entry_type": entry_type,
                "patient_name": patient_name,
                "patient_age": patient_age,
                "patient_gender": patient_gender,
                "doctor_name": doctor_name,
            })

            return data

    raise HTTPException(404, "Pending entry not found")


# -------------------------------------------------------------------
# APPROVE ENTRY
# -------------------------------------------------------------------
@router.post("/{id}/approve")
def approve_pending_entry(
    id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db)
    hospital_id = payload["hospital_id"]

    entry = crud.approve_medical_entry_pending(db, id, hospital_id)

    if not entry:
        raise HTTPException(400, "Failed to approve entry (expired or invalid)")

    log_action(
        db,
        action_type="hospital.approve_medical_entry",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="medical_entry_pending",
        target_entity_id=id,
    )

    return {"message": "Pending entry approved"}


# -------------------------------------------------------------------
# DECLINE ENTRY
# -------------------------------------------------------------------
@router.post("/{id}/decline")
def decline_pending_entry(
    id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db)
    hospital_id = payload["hospital_id"]

    entry = crud.decline_medical_entry_pending(db, id, hospital_id)

    if not entry:
        raise HTTPException(400, "Failed to decline entry (expired or invalid)")

    log_action(
        db,
        action_type="hospital.decline_medical_entry",
        user_role="hospital",
        user_id=hospital_id,
        target_entity="medical_entry_pending",
        target_entity_id=id,
    )

    return {"message": "Pending entry declined"}
