from sqlmodel import select
from app.db.models import HospitalRequest, DoctorRequest, Patient

def count_pending_hospital_requests(db):
    return len(
        db.exec(
            select(HospitalRequest).where(
                HospitalRequest.status == "pending"
            )
        ).all()
    )

def count_pending_doctor_requests(db):
    return len(
        db.exec(
            select(DoctorRequest).where(
                DoctorRequest.status == "pending"
            )
        ).all()
    )

def count_total_patients(db):
    return len(db.exec(select(Patient)).all())
