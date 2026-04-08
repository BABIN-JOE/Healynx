from sqlmodel import Session, select
from uuid import UUID
from app.db import models


def map_lab_to_entry(
    db: Session,
    lab_id,
    entry_type: str,
    entry_id,
):
    """
    Create a mapping between a lab result and a medical entry.
    entry_type values:
        visit
        surgery
        allergy
        long_term_condition
    """

    lab_id = UUID(str(lab_id))
    entry_id = UUID(str(entry_id))

    obj = models.LabMapping(
        lab_id=lab_id,
        entry_type=entry_type,
        entry_id=entry_id
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


def get_labs_for_entry(
    db: Session,
    entry_type: str,
    entry_id,
):
    """
    Get all labs linked to a specific medical entry.
    Used in Visit/Surgery/Allergy/Condition views.
    """

    entry_id = UUID(str(entry_id))

    statement = (
        select(models.LabResult)
        .join(models.LabMapping, models.LabMapping.lab_id == models.LabResult.id)
        .where(
            models.LabMapping.entry_type == entry_type,
            models.LabMapping.entry_id == entry_id
        )
        .order_by(models.LabResult.created_at.desc())
    )

    labs = db.exec(statement).all()

    results = []

    for lab in labs:
        results.append({
            "id": str(lab.id),
            "test_name": lab.test_name,
            "test_date": lab.test_date,
            "result_text": lab.result_text
        })

    return results


def get_entries_for_lab(
    db: Session,
    lab_id,
):
    """
    Get all medical entries linked to a lab result.
    Used in Lab view to show related visits/surgeries/etc.
    """

    lab_id = UUID(str(lab_id))

    mappings = db.exec(
        select(models.LabMapping)
        .where(models.LabMapping.lab_id == lab_id)
    ).all()

    results = []

    for m in mappings:
        results.append({
            "entry_type": m.entry_type,
            "entry_id": str(m.entry_id)
        })

    return results


def remove_lab_mapping(
    db: Session,
    lab_id,
    entry_type,
    entry_id
):
    """
    Remove a mapping between a lab and an entry.
    Useful if doctor edits or deletes linkage.
    """

    lab_id = UUID(str(lab_id))
    entry_id = UUID(str(entry_id))

    mapping = db.exec(
        select(models.LabMapping)
        .where(
            models.LabMapping.lab_id == lab_id,
            models.LabMapping.entry_type == entry_type,
            models.LabMapping.entry_id == entry_id
        )
    ).first()

    if not mapping:
        return False

    db.delete(mapping)
    db.commit()

    return True
