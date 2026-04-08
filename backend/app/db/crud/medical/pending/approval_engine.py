from app.core.time import utcnow, is_expired
from sqlmodel import Session, select
from typing import Optional
from app.db import models


# ============================================================
# GENERIC DECLINE
# ============================================================

def decline_pending(
    db: Session,
    pending_model,
    pending_id,
    reviewed_by,
):

    obj = db.exec(
        select(pending_model).where(pending_model.id == pending_id)
    ).first()

    if not obj or obj.status != "pending":
        return None

    obj.status = "declined"
    obj.approved_by = reviewed_by
    obj.approved_at = utcnow()

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


# ============================================================
# VISIT APPROVAL
# ============================================================

def approve_visit(db: Session, pending, reviewed_by):

    visit = models.Visit(
        patient_id=pending.patient_id,
        doctor_id=pending.doctor_id,
        hospital_id=pending.hospital_id,
        parent_visit_id=pending.parent_visit_id,
        visit_date=pending.visit_date,
        chief_complaint=pending.chief_complaint,
        diagnosis=pending.diagnosis,
        notes=pending.notes,
        followup_condition=pending.followup_condition,

        medication_name=pending.medication_name,
        medication_start_date=pending.medication_start_date,
        medication_end_date=pending.medication_end_date,
    )

    db.add(visit)

    pending.status = "approved"
    pending.approved_by = reviewed_by
    pending.approved_at = utcnow()

    db.add(pending)

    db.commit()
    db.refresh(visit)

    return visit


# ============================================================
# SURGERY APPROVAL
# ============================================================

def approve_surgery(db, pending, reviewed_by):

    # ----------------------------------
    # Handle followup surgeries
    # ----------------------------------
    surgery_name = pending.surgery_name
    body_part = pending.body_part
    reason = pending.reason
    description = pending.description
    surgery_date = pending.surgery_date
    admit_date = pending.admit_date
    discharge_date = pending.discharge_date

    # If followup → inherit from parent surgery
    if pending.parent_surgery_id:

        parent = db.exec(
            select(models.Surgery).where(
                models.Surgery.id == pending.parent_surgery_id
            )
        ).first()

        if parent:
            surgery_name = parent.surgery_name
            body_part = parent.body_part
            reason = parent.reason
            description = parent.description
            surgery_date = parent.surgery_date
            admit_date = parent.admit_date
            discharge_date = parent.discharge_date

    surgery = models.Surgery(
        patient_id=pending.patient_id,
        doctor_id=pending.doctor_id,
        hospital_id=pending.hospital_id,

        parent_surgery_id=pending.parent_surgery_id,

        surgery_name=surgery_name,
        body_part=body_part,
        reason=reason,
        description=description,

        notes=pending.notes,
        followup_condition=pending.followup_condition,

        surgery_date=surgery_date,
        admit_date=admit_date,
        discharge_date=discharge_date,

        medication_name=pending.medication_name,
        medication_start_date=pending.medication_start_date,
        medication_end_date=pending.medication_end_date
    )

    # Insert approved surgery
    db.add(surgery)

    # Update pending record status
    pending.status = "approved"
    pending.approved_by = reviewed_by
    pending.approved_at = utcnow()

    db.add(pending)

    db.commit()
    db.refresh(surgery)

    return surgery


# ============================================================
# ALLERGY APPROVAL
# ============================================================

def approve_allergy(db: Session, pending, reviewed_by):

    parent = None

    if pending.parent_allergy_id:
        parent = db.get(models.Allergy, pending.parent_allergy_id)

    allergy = models.Allergy(
        patient_id=pending.patient_id,
        doctor_id=pending.doctor_id,
        hospital_id=pending.hospital_id,

        parent_allergy_id=pending.parent_allergy_id,

        allergy_type=pending.allergy_type or (parent.allergy_type if parent else None),
        body_location=pending.body_location or (parent.body_location if parent else None),
        severity=pending.severity or (parent.severity if parent else None),

        first_noted_date=pending.first_noted_date or (parent.first_noted_date if parent else None),

        diagnosis=pending.diagnosis,
        notes=pending.notes,

        followup_condition=pending.followup_condition,

        medication_name=pending.medication_name,
        medication_start_date=pending.medication_start_date,
        medication_end_date=pending.medication_end_date
    )

    db.add(allergy)

    pending.status = "approved"
    pending.approved_by = reviewed_by
    pending.approved_at = utcnow()

    db.add(pending)

    db.commit()
    db.refresh(allergy)

    return allergy


# ============================================================
# LAB APPROVAL
# ============================================================

def approve_lab(db: Session, pending, reviewed_by):

    lab = models.LabResult(
        patient_id=pending.patient_id,
        doctor_id=pending.doctor_id,
        hospital_id=pending.hospital_id,

        test_name=pending.test_name,
        body_part=pending.body_part,
        test_date=pending.test_date,
        reason=pending.reason,
        result_text=pending.result_text,
    )

    db.add(lab)

    pending.status = "approved"
    pending.approved_by = reviewed_by
    pending.approved_at = utcnow()

    db.add(pending)

    db.commit()
    db.refresh(lab)

    return lab


# ============================================================
# IMMUNIZATION APPROVAL
# ============================================================

def approve_immunization(db: Session, pending, reviewed_by):

    immunization = models.Immunization(
        patient_id=pending.patient_id,
        doctor_id=pending.doctor_id,
        hospital_id=pending.hospital_id,
        vaccine_name=pending.vaccine_name,
        reason=pending.reason,
        dosage=pending.dosage,
        vaccination_date=pending.vaccination_date,
    )

    db.add(immunization)    

    pending.status = "approved"
    pending.approved_by = reviewed_by
    pending.approved_at = utcnow()

    db.add(pending)

    db.commit()
    db.refresh(immunization)

    return immunization


# ============================================================
# LONG TERM CONDITION APPROVAL
# ============================================================

def approve_long_term_condition(db: Session, pending, reviewed_by):

    parent = None

    # If followup → fetch parent condition
    if pending.parent_condition_id:
        parent = db.exec(
            select(models.LongTermCondition).where(
                models.LongTermCondition.id == pending.parent_condition_id
            )
        ).first()

    condition = models.LongTermCondition(
        patient_id=pending.patient_id,
        doctor_id=pending.doctor_id,
        hospital_id=pending.hospital_id,

        parent_condition_id=pending.parent_condition_id,

        # inherit from parent if missing
        condition_name=pending.condition_name or (parent.condition_name if parent else None),
        first_noted_date=pending.first_noted_date or (parent.first_noted_date if parent else None),

        current_condition=pending.current_condition,
        diagnosis=pending.diagnosis,
        notes=pending.notes,

        medication_name=pending.medication_name,
        medication_start_date=pending.medication_start_date,
        medication_end_date=pending.medication_end_date,
    )

    db.add(condition)

    pending.status = "approved"
    pending.approved_by = reviewed_by
    pending.approved_at = utcnow()

    db.add(pending)

    db.commit()
    db.refresh(condition)

    return condition

# ============================================================
# CENTRAL APPROVAL DISPATCHER
# ============================================================

def approve_medical_entry_pending(db: Session, pending_id, reviewed_by):

    pending_models = [
        (models.VisitPending, approve_visit),
        (models.SurgeryPending, approve_surgery),
        (models.AllergyPending, approve_allergy),
        (models.LabPending, approve_lab),
        (models.ImmunizationPending, approve_immunization),
        (models.LongTermConditionPending, approve_long_term_condition),
    ]

    for model, handler in pending_models:

        obj = db.exec(
            select(model).where(model.id == pending_id)
        ).first()

        if obj:

            if is_expired(obj.expires_at):

                obj.status = "expired"

                db.add(obj)
                db.commit()

                return None

            return handler(db, obj, reviewed_by)

    return None


# ============================================================
# DECLINE DISPATCHER
# ============================================================

def decline_medical_entry_pending(
    db: Session,
    pending_id,
    reviewed_by,
    decline_reason: Optional[str] = None
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

            obj.status = "declined"
            obj.approved_by = reviewed_by
            obj.approved_at = utcnow()
            obj.decline_reason = decline_reason

            db.add(obj)
            db.commit()
            db.refresh(obj)

            return obj

    return None