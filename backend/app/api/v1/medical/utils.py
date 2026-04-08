from app.core.time import utcnow
from fastapi import HTTPException
from sqlmodel import Session, select
from datetime import datetime
from app.db import models
from uuid import UUID


def validate_patient_access(patient_id: str, doctor_id: str, db: Session):
    patient_id = UUID(str(patient_id))
    mapping = db.exec(
        select(models.HospitalDoctorMap).where(
            models.HospitalDoctorMap.doctor_id == doctor_id,
            models.HospitalDoctorMap.soft_deleted == False
        )
    ).first()

    if not mapping:
        raise HTTPException(403, "Doctor not mapped to hospital")

    access = db.exec(
        select(models.PatientAccessRequest)
        .join(
            models.Patient,
            models.Patient.aadhaar_hash == models.PatientAccessRequest.patient_aadhaar_hash
        )
        .where(
            models.PatientAccessRequest.doctor_id == doctor_id,
            models.PatientAccessRequest.hospital_id == mapping.hospital_id,
            models.PatientAccessRequest.status == "approved",
            models.PatientAccessRequest.expires_at > utcnow(),
            models.Patient.id == patient_id
        )
    ).first()

    if not access:
        raise HTTPException(403, "Patient access expired")

    return mapping
