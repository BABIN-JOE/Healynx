from app.core.time import utcnow
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlmodel import Session, select
from datetime import date, datetime
from uuid import UUID

from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db import models
from app.core.audit import log_action

# Pending creators
from app.db.crud.medical.pending.visit_pending import create_visit_pending
from app.db.crud.medical.pending.surgery_pending import create_surgery_pending
from app.db.crud.medical.pending.allergy_pending import create_allergy_pending
from app.db.crud.medical.pending.lab_pending import create_lab_pending
from app.db.crud.medical.pending.immunization_pending import create_immunization_pending
from app.db.crud.medical.pending.long_term_condition_pending import (
    create_long_term_condition_pending
)

# Centralized approval engine
from app.db.crud.medical.pending.approval_engine import (
    approve_medical_entry_pending,
    decline_medical_entry_pending
)

from app.db.crud.medical.pending.base import reset_pending_workflow

router = APIRouter()

# ==========================================================
# 1️⃣ DOCTOR CREATES PENDING ENTRY
# ==========================================================
@router.post("/entries/pending")
def create_pending_entry(
    data: dict = Body(...),
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 

    doctor_id = payload.get("doctor_id")

    mapping = db.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            models.HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if not mapping:
        raise HTTPException(403, "Doctor not mapped to hospital")

    hospital_id = mapping.hospital_id

    entry_type = data.get("type")
    patient_id = data.get("patient_id")

    if not entry_type or not patient_id:
        raise HTTPException(400, "type and patient_id required")

    # ---------------- VISIT ----------------
    if entry_type == "visit":

        pending = create_visit_pending(
            db=db,
            patient_id=patient_id,
            doctor_id=doctor_id,
            hospital_id=hospital_id,

            parent_visit_id=data.get("parent_visit_id"),

            chief_complaint=data.get("chief_complaint"),
            diagnosis=data.get("diagnosis"),
            notes=data.get("notes"),
            followup_condition=data.get("followup_condition"),

            medication_name=data.get("medication_name"),
            medication_start_date=data.get("medication_start_date"),
            medication_end_date=data.get("medication_end_date"),
        )

    # ---------------- SURGERY ----------------
    elif entry_type == "surgery":

        pending = create_surgery_pending(
            db=db,
            patient_id=patient_id,
            doctor_id=doctor_id,
            hospital_id=hospital_id,

            parent_surgery_id=data.get("parent_surgery_id"),

            surgery_name=data.get("surgery_name"),
            body_part=data.get("body_part"),
            reason=data.get("reason"),
            description=data.get("description"),
            notes=data.get("notes"),

            surgery_date=data.get("surgery_date"),
            admit_date=data.get("admit_date"),
            discharge_date=data.get("discharge_date"),

            followup_condition=data.get("followup_condition"),

            medication_name=data.get("medication_name"),
            medication_start_date=data.get("medication_start_date"),
            medication_end_date=data.get("medication_end_date"),
        )

    # ---------------- ALLERGY ----------------
    elif entry_type == "allergy":

        pending = create_allergy_pending(
            db=db,
            patient_id=patient_id,
            doctor_id=doctor_id,
            hospital_id=hospital_id,

            parent_allergy_id=data.get("parent_allergy_id"),

            allergy_type=data.get("allergy_type"),
            body_location=data.get("body_location"),
            severity=data.get("severity"),

            first_noted_date=data.get("first_noted_date"),

            diagnosis=data.get("diagnosis"),
            notes=data.get("notes"),
            followup_condition=data.get("followup_condition"),

            medication_name=data.get("medication_name"),
            medication_start_date=data.get("medication_start_date"),
            medication_end_date=data.get("medication_end_date"),
        )

    # ---------------- LONG TERM CONDITION ----------------
    elif entry_type == "long_term_condition":

        pending = create_long_term_condition_pending(
            db=db,
            patient_id=patient_id,
            doctor_id=doctor_id,
            hospital_id=hospital_id,

            parent_condition_id=data.get("parent_condition_id"),

            condition_name=data.get("condition_name"),
            first_noted_date=data.get("first_noted_date"),

            current_condition=data.get("current_condition"),
            diagnosis=data.get("diagnosis"),
            notes=data.get("notes"),

            medication_name=data.get("medication_name"),
            medication_start_date=data.get("medication_start_date"),
            medication_end_date=data.get("medication_end_date"),
        )

    # ---------------- LAB ----------------
    elif entry_type == "lab":

        pending = create_lab_pending(
            db=db,
            patient_id=patient_id,
            doctor_id=doctor_id,
            hospital_id=hospital_id,

            test_name=data.get("test_name"),
            body_part=data.get("body_part"),
            reason=data.get("reason"),

            result_text=data.get("result_text"),
            notes=data.get("notes"),

            test_date=data.get("test_date"),
        )

    # ---------------- IMMUNIZATION ----------------
    elif entry_type == "immunization":

        pending = create_immunization_pending(
            db=db,
            patient_id=patient_id,
            doctor_id=doctor_id,
            hospital_id=hospital_id,

            vaccine_name=data.get("vaccine_name"),
            reason=data.get("reason"),
            dosage=data.get("dosage"),

            vaccination_date=data.get("vaccination_date"),
            notes=data.get("notes"),
        )

    else:
        raise HTTPException(400, "Invalid entry type")

    log_action(
        db,
        action_type="doctor.create_pending_entry",
        user_role="doctor",
        user_id=doctor_id,
        target_entity=f"{entry_type}_pending",
        target_entity_id=pending.id,
    )

    return {
        "pending_id": str(pending.id),
        "type": entry_type,
        "status": pending.status,
        "created_at": pending.created_at,
    }


# ==========================================================
# 2️⃣ HOSPITAL LIST PENDING
# ==========================================================
@router.get("/entries/pending")
def list_pending_entries(
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):

    hospital_id = UUID(str(payload.get("hospital_id")))

    pending_models = [
        models.VisitPending,
        models.SurgeryPending,
        models.AllergyPending,
        models.LabPending,
        models.ImmunizationPending,
        models.LongTermConditionPending,
    ]

    result = []

    for model in pending_models:

        rows = db.exec(
            select(model).where(
                model.hospital_id == hospital_id,
                model.status == "pending"
            )
        ).all()

        for r in rows:
            result.append({
                "id": str(r.id),
                "type": model.__name__.replace("Pending", "").lower(),
                "patient_id": str(r.patient_id),
                "doctor_id": str(r.doctor_id),
                "created_at": r.created_at,
                "expires_at": r.expires_at,
                "status": r.status,
            })

    result.sort(key=lambda x: x["created_at"], reverse=True)

    return result


# ==========================================================
# 3️⃣ HOSPITAL APPROVE
# ==========================================================
@router.post("/entries/pending/{pending_id}/approve")
def approve_pending_entry(
    pending_id: str,
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 

    hospital_id = UUID(str(payload.get("hospital_id")))

    history = approve_medical_entry_pending(
        db=db,
        pending_id=pending_id,
        reviewed_by=hospital_id,
    )

    if not history:
        raise HTTPException(400, "Pending entry not found or invalid")

    return {
        "message": "Entry approved",
        "history_id": str(history.id)
    }


# ==========================================================
# 4️⃣ HOSPITAL DECLINE
# ==========================================================
@router.post("/entries/pending/{pending_id}/decline")
def decline_pending_entry(
    pending_id: str,
    data: dict = Body(...),
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 

    hospital_id = UUID(str(payload.get("hospital_id")))
    reason = data.get("reason")

    if not reason or not reason.strip():
        raise HTTPException(400, "Decline reason is required")

    obj = decline_medical_entry_pending(
        db=db,
        pending_id=pending_id,
        reviewed_by=hospital_id,
        decline_reason=reason
    )

    if not obj:
        raise HTTPException(400, "Pending entry not found")

    return {
        "message": "Entry declined",
        "decline_reason": reason
    }

# ==========================================================
# 5️⃣ DOCTOR ENTRY HISTORY (72h visibility)
# ==========================================================
from app.db.crud.medical.pending.history import get_doctor_pending_history


@router.get("/entries/doctor-history")
def doctor_entry_history(
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):

    doctor_id = payload.get("doctor_id")

    rows = get_doctor_pending_history(db, doctor_id)

    result = []

    for r in rows:

        result.append({
            "id": str(r.id),
            "type": r.__class__.__name__.replace("Pending", "").lower(),
            "status": r.status,
            "patient_id": str(r.patient_id),
            "created_at": r.created_at,
            "expires_at": r.expires_at,
            "reviewed_at": getattr(r, "approved_at", None),
            "decline_reason": getattr(r, "decline_reason", None),
            "can_edit": r.status in ["declined", "expired"],
            "can_rerequest": r.status in ["declined", "expired"],
        })

    return result


# ==========================================================
# 6️⃣ VIEW ENTRY DETAILS
# ==========================================================
@router.get("/entries/pending/{pending_id}")
def get_pending_entry_details(
    pending_id: str,
    db = Depends(get_db),
):

    pending_models = [
        models.VisitPending,
        models.SurgeryPending,
        models.AllergyPending,
        models.LabPending,
        models.ImmunizationPending,
        models.LongTermConditionPending,
    ]

    for model in pending_models:

        obj = db.exec(
            select(model).where(model.id == pending_id)
        ).first()

        if obj:

            # ---------------- PATIENT ----------------
            patient = db.exec(
                select(models.Patient).where(
                    models.Patient.id == obj.patient_id
                )
            ).first()

            patient_name = None
            patient_age = None
            patient_gender = None

            if patient:

                first = getattr(patient, "first_name", "")
                last = getattr(patient, "last_name", "")

                patient_name = f"{first} {last}".strip()
                patient_gender = getattr(patient, "gender", None)

                if patient and patient.dob:

                    try:
                        dob = patient.dob

                        if isinstance(dob, str):
                            dob = datetime.strptime(dob, "%Y-%m-%d").date()

                        today = date.today()

                        patient_age = today.year - dob.year - (
                            (today.month, today.day) < (dob.month, dob.day)
                        )

                    except Exception as e:
                        print("DOB parse error:", e)
                        patient_age = None

            # ---------------- DOCTOR ----------------
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

            # ---------------- HOSPITAL ----------------
            hospital = db.exec(
                select(models.Hospital).where(
                    models.Hospital.id == obj.hospital_id
                )
            ).first()

            hospital_name = getattr(hospital, "name", None) if hospital else None

            # ---------------- RESPONSE ----------------
            data = obj.model_dump()

            data.update({
                "type": model.__name__.replace("Pending", "").lower(),
                "patient_name": patient_name,
                "patient_age": patient_age,
                "patient_gender": patient_gender,
                "doctor_name": doctor_name,
                "hospital_name": hospital_name,
                "decline_reason": getattr(obj, "decline_reason", None),
                "status": getattr(obj, "status", None),
            })

            return data

    raise HTTPException(404, "Pending entry not found")


# ==========================================================
# 7️⃣ DOCTOR RE-REQUEST DECLINED / EXPIRED ENTRY
# ==========================================================
@router.post("/entries/pending/{pending_id}/rerequest")
def rerequest_pending_entry(
    pending_id: str,
    payload: dict = Body(default={}),
    user=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 

    doctor_id = user["doctor_id"]

    pending_models = [
        models.VisitPending,
        models.SurgeryPending,
        models.AllergyPending,
        models.LabPending,
        models.ImmunizationPending,
        models.LongTermConditionPending,
    ]

    for model in pending_models:

        obj = db.exec(
            select(model).where(model.id == pending_id)
        ).first()

        if obj:

            if str(obj.doctor_id) != str(doctor_id):
                raise HTTPException(403, "You cannot edit this entry")

            for key, value in payload.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            reset_pending_workflow(obj)

            db.add(obj)
            db.commit()
            db.refresh(obj)

            return obj

    raise HTTPException(404, "Pending entry not found")


# -------------------------------------------------------------------
# 8️⃣ EDIT PENDING ENTRY
# -------------------------------------------------------------------
@router.put("/entries/pending/{pending_id}")
def edit_pending_entry(
    pending_id: str,
    payload: dict,
    user=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
    request: Request = None,
):
    verify_csrf(request, db) 

    doctor_id = user["doctor_id"]

    pending_models = [
        models.VisitPending,
        models.SurgeryPending,
        models.AllergyPending,
        models.LabPending,
        models.ImmunizationPending,
        models.LongTermConditionPending,
    ]

    for model in pending_models:

        obj = db.exec(
            select(model).where(model.id == pending_id)
        ).first()

        if obj:

            if str(obj.doctor_id) != str(doctor_id):
                raise HTTPException(403, "Not allowed to edit this entry")

            for key, value in payload.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            reset_pending_workflow(obj)

            db.add(obj)
            db.commit()
            db.refresh(obj)

            return obj

    raise HTTPException(404, "Pending entry not found")
