from sqlmodel import Session, select
from typing import List, Dict
from app.db import models


def get_all_approved_entries_for_patient(
    db: Session,
    patient_id
) -> List[Dict]:

    results: List[Dict] = []

    # ============================================================
    # VISITS
    # ============================================================

    visits = db.exec(
        select(models.Visit)
        .where(models.Visit.patient_id == patient_id)
    ).all()

    for v in visits:
        results.append({
            "id": str(v.id),
            "entry_type": "visit",
            "visit_date": v.visit_date,
            "chief_complaint": v.chief_complaint,
            "diagnosis": v.diagnosis,
            "notes": v.notes,
            "created_at": v.created_at,
        })

    # ============================================================
    # SURGERIES
    # ============================================================

    surgeries = db.exec(
        select(models.Surgery)
        .where(models.Surgery.patient_id == patient_id)
    ).all()

    for s in surgeries:
        results.append({
            "id": str(s.id),
            "entry_type": "surgery",
            "surgery_name": s.surgery_name,
            "body_part": s.body_part,
            "reason": s.reason,
            "description": s.description,
            "surgery_date": s.surgery_date,
            "admit_date": s.admit_date,
            "discharge_date": s.discharge_date,
            "created_at": s.created_at,
        })

    # ============================================================
    # MEDICATIONS
    # ============================================================

    medications = db.exec(
        select(models.Medication)
        .where(models.Medication.patient_id == patient_id)
    ).all()

    for m in medications:
        results.append({
            "id": str(m.id),
            "entry_type": "medication",
            "medication_name": m.medication_name,
            "dosage": m.dosage,
            "frequency": m.frequency,
            "start_date": m.start_date,
            "end_date": m.end_date,
            "reason": m.reason,
            "status": m.status,
            "related_visit_id": m.related_visit_id,
            "related_surgery_id": m.related_surgery_id,
            "related_allergy_id": m.related_allergy_id,
            "related_condition_id": m.related_condition_id,
            "created_at": m.created_at,
        })

    # ============================================================
    # ALLERGIES
    # ============================================================

    allergies = db.exec(
        select(models.Allergy)
        .where(models.Allergy.patient_id == patient_id)
    ).all()

    for a in allergies:
        results.append({
            "id": str(a.id),
            "entry_type": "allergy",
            "allergy_type": a.allergy_type,
            "body_location": a.body_location,
            "severity": a.severity,
            "diagnosis": a.diagnosis,
            "created_at": a.created_at,
        })

    # ============================================================
    # LAB RESULTS
    # ============================================================

    labs = db.exec(
        select(models.LabResult)
        .where(models.LabResult.patient_id == patient_id)
    ).all()

    for l in labs:
        results.append({
            "id": str(l.id),
            "entry_type": "lab",
            "test_type": l.test_type,
            "body_part": l.body_part,
            "reason": l.reason,
            "result_text": l.result_text,
            "created_at": l.created_at,
        })

    # ============================================================
    # IMMUNIZATIONS
    # ============================================================

    immunizations = db.exec(
        select(models.Immunization)
        .where(models.Immunization.patient_id == patient_id)
    ).all()

    for i in immunizations:
        results.append({
            "id": str(i.id),
            "entry_type": "immunization",
            "vaccine_name": i.vaccine_name,
            "reason": i.reason,
            "dosage": i.dosage,
            "vaccination_date": i.vaccination_date,
            "created_at": i.created_at,
        })

    # ============================================================
    # LONG TERM CONDITIONS
    # ============================================================

    conditions = db.exec(
        select(models.LongTermCondition)
        .where(models.LongTermCondition.patient_id == patient_id)
    ).all()

    for c in conditions:
        results.append({
            "id": str(c.id),
            "entry_type": "long_term_condition",
            "condition_name": c.condition_name,
            "diagnosis_date": c.diagnosis_date,
            "status": c.status,
            "notes": c.notes,
            "created_at": c.created_at,
        })

    # ============================================================
    # FOLLOWUPS
    # ============================================================

    followups = db.exec(
        select(models.FollowUp)
        .where(models.FollowUp.patient_id == patient_id)
    ).all()

    for f in followups:
        results.append({
            "id": str(f.id),
            "entry_type": "followup",
            "followup_date": f.followup_date,
            "notes": f.notes,
            "related_visit_id": f.related_visit_id,
            "related_surgery_id": f.related_surgery_id,
            "related_allergy_id": f.related_allergy_id,
            "related_condition_id": f.related_condition_id,
            "created_at": f.created_at,
        })

    # ============================================================
    # SORT ALL ENTRIES (newest first)
    # ============================================================

    results.sort(key=lambda x: x["created_at"], reverse=True)

    return results
