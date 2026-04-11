from app.core.time import *
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from uuid import UUID

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.config import settings
from app.db import models   

router = APIRouter()


@router.get("/patient/{patient_id}/approved-entries")
def get_approved_entries_for_patient(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):

    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    # ------------------------------------------------
    # Validate doctor ↔ hospital mapping
    # ------------------------------------------------

    mapping = db.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            models.HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if not mapping:
        raise HTTPException(403, "Doctor not mapped to hospital")

    hospital_id = mapping.hospital_id

    # ------------------------------------------------
    # Validate ACCESS SESSION
    # ------------------------------------------------

    session_obj = db.exec(
        select(models.PatientAccessSession)
        .where(
            models.PatientAccessSession.doctor_id == doctor_id,
            models.PatientAccessSession.hospital_id == hospital_id,
            models.PatientAccessSession.patient_id == patient_id
        )
    ).first()

    if not session_obj:
        raise HTTPException(403, "Patient access not found")

    # ------------------------------------------------
    # Validate VIEW WINDOW (30 min)
    # ------------------------------------------------

    if is_expired(session_obj.view_expires_at):
        raise HTTPException(403, "View access expired")

    # ------------------------------------------------
    # Validate ENTRY WINDOW (24 hours)
    # ------------------------------------------------

    if is_expired(session_obj.entry_expires_at):
        raise HTTPException(403, "Entry access expired")

    result = []

    # ==========================================================
    # VISITS
    # ==========================================================

    visits = db.exec(
        select(models.Visit).where(
            models.Visit.patient_id == patient_id,
            models.Visit.parent_visit_id == None
        )
    ).all()

    for v in visits:

        # ---------------- DOCTOR ----------------
        doctor = db.exec(
            select(models.Doctor).where(
                models.Doctor.id == v.doctor_id
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
                models.Hospital.id == v.hospital_id
            )
        ).first()

        hospital_name = getattr(hospital, "name", None) if hospital else None

        # ---------------- FOLLOWUPS ----------------
        followups = db.exec(
            select(models.Visit).where(
                models.Visit.parent_visit_id == v.id
            )
        ).all()

        followup_list = []

        for f in followups:
            followup_list.append({
                "id": str(f.id),
                "visit_date": f.visit_date,
                "followup_condition": f.followup_condition,
                "notes": f.notes,
                "medication_name": f.medication_name,
                "medication_start_date": f.medication_start_date,
                "medication_end_date": f.medication_end_date,
                "created_at": f.created_at
            })

        # ---------------- LAB MAPPINGS ----------------
        lab_mappings = db.exec(
            select(models.LabMapping).where(
                models.LabMapping.entry_type == "visit",
                models.LabMapping.entry_id == v.id
            )
        ).all()

        labs = []

        for lm in lab_mappings:

            lab = db.exec(
                select(models.LabResult).where(
                    models.LabResult.id == lm.lab_id
                )
            ).first()

            if lab:
                labs.append({
                    "id": str(lab.id),
                    "test_name": lab.test_name,
                    "test_date": lab.test_date,
                    "result_text": lab.result_text
                })

        # ---------------- FINAL VISIT RECORD ----------------
        result.append({
            "id": str(v.id),
            "entry_type": "visit",

            "visit_date": v.visit_date,
            "chief_complaint": v.chief_complaint,
            "diagnosis": v.diagnosis,
            "notes": v.notes,

            "medication_name": v.medication_name,
            "medication_start_date": v.medication_start_date,
            "medication_end_date": v.medication_end_date,

            "doctor_name": doctor_name,
            "hospital_name": hospital_name,

            "labs": labs,
            "followups": followup_list,

            "created_at": v.created_at
        })

    # ==========================================================
    # SURGERIES
    # ==========================================================

    surgeries = db.exec(
        select(models.Surgery).where(
            models.Surgery.patient_id == patient_id,
            models.Surgery.parent_surgery_id == None
        )
    ).all()

    for s in surgeries:

        # ---------------- DOCTOR ----------------
        doctor = db.exec(
            select(models.Doctor).where(
                models.Doctor.id == s.doctor_id
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
                models.Hospital.id == s.hospital_id
            )
        ).first()

        hospital_name = getattr(hospital, "name", None) if hospital else None

        # ---------------- FOLLOWUPS ----------------
        followups = db.exec(
            select(models.Surgery).where(
                models.Surgery.parent_surgery_id == s.id
            )
        ).all()

        followup_list = []

        for f in followups:
            followup_list.append({
                "id": str(f.id),
                "followup_condition": f.followup_condition,
                "notes": f.notes,
                "medication_name": f.medication_name,
                "medication_start_date": f.medication_start_date,
                "medication_end_date": f.medication_end_date,
                "created_at": f.created_at
            })

        # ---------------- LAB MAPPINGS ----------------
        lab_mappings = db.exec(
            select(models.LabMapping).where(
                models.LabMapping.entry_type == "surgery",
                models.LabMapping.entry_id == s.id
            )
        ).all()

        labs = []

        for lm in lab_mappings:

            lab = db.exec(
                select(models.LabResult).where(
                    models.LabResult.id == lm.lab_id
                )
            ).first()

            if lab:
                labs.append({
                    "id": str(lab.id),
                    "test_name": lab.test_name,
                    "test_date": lab.test_date,
                    "result_text": lab.result_text
                })

        # ---------------- FINAL SURGERY RECORD ----------------
        result.append({
            "id": str(s.id),
            "entry_type": "surgery",

            "surgery_name": s.surgery_name,
            "body_part": s.body_part,
            "reason": s.reason,
            "description": s.description,
            "notes": s.notes,

            "surgery_date": s.surgery_date,
            "admit_date": s.admit_date,
            "discharge_date": s.discharge_date,

            "medication_name": s.medication_name,
            "medication_start_date": s.medication_start_date,
            "medication_end_date": s.medication_end_date,

            "doctor_name": doctor_name,
            "hospital_name": hospital_name,

            "labs": labs,
            "followups": followup_list,

            "created_at": s.created_at
        })

    # ==========================================================
    # ALLERGIES
    # ==========================================================

    allergies = db.exec(
        select(models.Allergy).where(
            models.Allergy.patient_id == patient_id,
            models.Allergy.parent_allergy_id == None
        )
    ).all()

    for a in allergies:

        # ---------------- DOCTOR ----------------
        doctor = db.exec(
            select(models.Doctor).where(
                models.Doctor.id == a.doctor_id
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
                models.Hospital.id == a.hospital_id
            )
        ).first()

        hospital_name = getattr(hospital, "name", None) if hospital else None

        # ---------------- FOLLOWUPS ----------------
        followups = db.exec(
            select(models.Allergy).where(
                models.Allergy.parent_allergy_id == a.id
            )
        ).all()

        followup_list = []

        for f in followups:
            followup_list.append({
                "id": str(f.id),
                "followup_condition": f.followup_condition,
                "notes": f.notes,
                "medication_name": f.medication_name,
                "medication_start_date": f.medication_start_date,
                "medication_end_date": f.medication_end_date,
                "created_at": f.created_at
            })

        # ---------------- LAB MAPPINGS ----------------
        lab_mappings = db.exec(
            select(models.LabMapping).where(
                models.LabMapping.entry_type == "allergy",
                models.LabMapping.entry_id == a.id
            )
        ).all()

        labs = []

        for lm in lab_mappings:

            lab = db.exec(
                select(models.LabResult).where(
                    models.LabResult.id == lm.lab_id
                )
            ).first()

            if lab:
                labs.append({
                    "id": str(lab.id),
                    "test_name": lab.test_name,
                    "test_date": lab.test_date,
                    "result_text": lab.result_text
                })

        # ---------------- FINAL ALLERGY RECORD ----------------
        result.append({
            "id": str(a.id),
            "entry_type": "allergy",

            "allergy_type": a.allergy_type,
            "body_location": a.body_location,
            "severity": a.severity,
            "diagnosis": a.diagnosis,
            "notes": a.notes,

            "first_noted_date": a.first_noted_date,

            "medication_name": a.medication_name,
            "medication_start_date": a.medication_start_date,
            "medication_end_date": a.medication_end_date,

            "doctor_name": doctor_name,
            "hospital_name": hospital_name,

            "labs": labs,
            "followups": followup_list,

            "created_at": a.created_at
        })

    # ==========================================================
    # LONG TERM CONDITIONS
    # ==========================================================

    conditions = db.exec(
        select(models.LongTermCondition).where(
            models.LongTermCondition.patient_id == patient_id,
            models.LongTermCondition.parent_condition_id == None
        )
    ).all()

    for c in conditions:

        # ---------------- DOCTOR ----------------
        doctor = db.exec(
            select(models.Doctor).where(
                models.Doctor.id == c.doctor_id
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
                models.Hospital.id == c.hospital_id
            )
        ).first()

        hospital_name = getattr(hospital, "name", None) if hospital else None

        # ---------------- FOLLOWUPS ----------------
        followups = db.exec(
            select(models.LongTermCondition).where(
                models.LongTermCondition.parent_condition_id == c.id
            )
        ).all()

        followup_list = []

        for f in followups:
            followup_list.append({
                "id": str(f.id),
                "current_condition": f.current_condition,
                "diagnosis": f.diagnosis,
                "notes": f.notes,
                "medication_name": f.medication_name,
                "medication_start_date": f.medication_start_date,
                "medication_end_date": f.medication_end_date,
                "created_at": f.created_at
            })

        # ---------------- LAB MAPPINGS ----------------
        lab_mappings = db.exec(
            select(models.LabMapping).where(
                models.LabMapping.entry_type == "long_term_condition",
                models.LabMapping.entry_id == c.id
            )
        ).all()

        labs = []

        for lm in lab_mappings:

            lab = db.exec(
                select(models.LabResult).where(
                    models.LabResult.id == lm.lab_id
                )
            ).first()

            if lab:
                labs.append({
                    "id": str(lab.id),
                    "test_name": lab.test_name,
                    "test_date": lab.test_date,
                    "result_text": lab.result_text
                })

        # ---------------- FINAL CONDITION RECORD ----------------
        result.append({
            "id": str(c.id),
            "entry_type": "long_term_condition",

            "condition_name": c.condition_name,
            "first_noted_date": c.first_noted_date,
            "current_condition": c.current_condition,
            "diagnosis": c.diagnosis,
            "notes": c.notes,

            "medication_name": c.medication_name,
            "medication_start_date": c.medication_start_date,
            "medication_end_date": c.medication_end_date,

            "doctor_name": doctor_name,
            "hospital_name": hospital_name,

            "labs": labs,
            "followups": followup_list,

            "created_at": c.created_at
        })

    # ==========================================================
    # IMMUNIZATIONS
    # ==========================================================

    immunizations = db.exec(
        select(models.Immunization).where(
            models.Immunization.patient_id == patient_id
        )
    ).all()

    for i in immunizations:

        # ---------------- DOCTOR ----------------
        doctor = db.exec(
            select(models.Doctor).where(
                models.Doctor.id == i.doctor_id
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
                models.Hospital.id == i.hospital_id
            )
        ).first()

        hospital_name = getattr(hospital, "name", None) if hospital else None

        # ---------------- FINAL IMMUNIZATION RECORD ----------------
        result.append({
            "id": str(i.id),
            "entry_type": "immunization",

            "vaccine_name": i.vaccine_name,
            "dosage": i.dosage,
            "reason": i.reason,
            "vaccination_date": i.vaccination_date,
            "notes": i.notes,

            "doctor_name": doctor_name,
            "hospital_name": hospital_name,

            "created_at": i.created_at
        })

    # ==========================================================
    # LAB RESULTS
    # ==========================================================

    labs = db.exec(
        select(models.LabResult).where(
            models.LabResult.patient_id == patient_id
        )
    ).all()

    for l in labs:

        # ---------------- DOCTOR ----------------
        doctor = db.exec(
            select(models.Doctor).where(
                models.Doctor.id == l.doctor_id
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
                models.Hospital.id == l.hospital_id
            )
        ).first()

        hospital_name = getattr(hospital, "name", None) if hospital else None

        # ---------------- LAB MAPPINGS ----------------
        mappings = db.exec(
            select(models.LabMapping).where(
                models.LabMapping.lab_id == l.id
            )
        ).all()

        mapped_entries = []

        for m in mappings:
            mapped_entries.append({
                "entry_type": m.entry_type,
                "entry_id": str(m.entry_id)
            })

        # ---------------- FINAL LAB RECORD ----------------
        result.append({
            "id": str(l.id),
            "entry_type": "lab",

            "test_name": l.test_name,
            "body_part": l.body_part,
            "reason": l.reason,
            "result_text": l.result_text,
            "notes": l.notes,
            "test_date": l.test_date,

            "doctor_name": doctor_name,
            "hospital_name": hospital_name,

            "mapped_entries": mapped_entries,

            "created_at": l.created_at
        })

    # ==========================================================
    # FINAL SORTING
    # ==========================================================

    result.sort(
        key=lambda x: x.get("created_at", datetime.min),
        reverse=True
    )

    return result

 
# ==========================================================
# PREVIOUS ENTRIES (FOR QUICK ACCESS IN FRONTEND)
# ==========================================================
@router.get("/patient/{patient_id}/visits")
def get_previous_visits(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):

    try:
        patient_uuid = UUID(patient_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    visits = db.exec(
        select(models.Visit).where(
            models.Visit.patient_id == patient_uuid,
            models.Visit.parent_visit_id.is_(None)
        )
        .order_by(models.Visit.visit_date.desc())
        .limit(4)
    ).all()

    return [
        {
            "id": str(v.id),
            "visit_date": v.visit_date,
            "chief_complaint": v.chief_complaint,
        }
        for v in visits
    ]

@router.get("/patient/{patient_id}/surgeries")
def get_previous_surgeries(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):

    surgeries = db.exec(
        select(models.Surgery).where(
            models.Surgery.patient_id == patient_id,
            models.Surgery.parent_surgery_id == None
        )
    ).all()

    return [
        {
            "id": str(s.id),
            "surgery_name": s.surgery_name,
            "surgery_date": s.surgery_date,
        }
        for s in surgeries
    ]

@router.get("/patient/{patient_id}/allergies")
def get_previous_allergies(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):

    allergies = db.exec(
        select(models.Allergy).where(
            models.Allergy.patient_id == patient_id,
            models.Allergy.parent_allergy_id == None
        )
    ).all()

    return [
        {
            "id": str(a.id),
            "allergy_type": a.allergy_type,
            "severity": a.severity,
            "created_at": a.created_at
        }
        for a in allergies
    ]

@router.get("/patient/{patient_id}/conditions")
def get_previous_conditions(
    patient_id: str,
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):

    conditions = db.exec(
        select(models.LongTermCondition).where(
            models.LongTermCondition.patient_id == patient_id,
            models.LongTermCondition.parent_condition_id == None
        )
    ).all()

    return [
        {
            "id": str(c.id),
            "condition_name": c.condition_name,
            "created_at": c.created_at
        }
        for c in conditions
    ]


#AI PART

from app.services.ai.ai_service import ask_ai
from app.services.ai.context_builder import build_patient_context

class AIRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=settings.MAX_AI_QUESTION_LENGTH)


@router.post("/ask-ai/{patient_id}")
def ask_ai_route(
    patient_id: str,
    request: AIRequest = Body(...),
    payload=Depends(require_role([Role.DOCTOR])),
    db: Session = Depends(get_db)
):
    question = request.question.strip()
    doctor_id = payload.get("doctor_id")

    if not doctor_id:
        raise HTTPException(status_code=401, detail="Doctor authentication required")

    mapping = db.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            models.HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if not mapping:
        raise HTTPException(status_code=403, detail="Doctor not mapped to hospital")

    session_obj = db.exec(
        select(models.PatientAccessSession).where(
            models.PatientAccessSession.doctor_id == doctor_id,
            models.PatientAccessSession.hospital_id == mapping.hospital_id,
            models.PatientAccessSession.patient_id == patient_id,
        )
    ).first()

    if not session_obj or is_expired(session_obj.view_expires_at):
        raise HTTPException(status_code=403, detail="No active access to this patient")

    from app.db.crud.medical.history import (
        visit,
        allergy,
        surgery,
        lab,
        immunization,
        long_term_condition,
    )

    data = {
        "visits": visit.get_patient_visits(db, patient_id),
        "allergies": allergy.get_patient_allergies(db, patient_id),
        "surgeries": surgery.get_patient_surgeries(db, patient_id),
        "labs": lab.get_patient_lab_results(db, patient_id),
        "immunizations": immunization.get_patient_immunizations(db, patient_id),
        "conditions": long_term_condition.get_patient_long_term_conditions(db, patient_id),
    }

    # Ensure at least one dataset contains information
    if not any(data.values()):
        raise HTTPException(status_code=404, detail="No patient data found")

    context = build_patient_context(data)
    answer = ask_ai(question, context)

    return {
        "patient_id": patient_id,
        "question": question,
        "answer": answer
    }
