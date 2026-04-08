# app/api/v1/admin/doctor/get_doctor.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import Doctor, Hospital, HospitalDoctorMap
from app.core.crypto import aesgcm_decrypt_str
import json

router = APIRouter()   # ❗ NO PREFIX HERE

def decrypt_field(value):
    try:
        return aesgcm_decrypt_str(value) if value else None
    except:
        return None

@router.get("/doctors/{doctor_id}", summary="Get doctor details")
def get_doctor(
    doctor_id: str,
    db = Depends(get_db),
    payload = Depends(require_role([Role.ADMIN]))
):
    doctor = db.get(Doctor, doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    d = db.get(Doctor, doctor_id)
    if not d:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # decrypt address
    address = None
    if doctor.address_encrypted:
        try:
            address = json.loads(aesgcm_decrypt_str(doctor.address_encrypted))
        except:
            pass

    # find active hospital
    stmt = select(HospitalDoctorMap).where(
        HospitalDoctorMap.doctor_id == doctor.id,
        HospitalDoctorMap.is_active == True,
        HospitalDoctorMap.soft_deleted == False
    )
    mapping = db.exec(stmt).first()

    hospital_name = None
    hospital_license_number = None

    if mapping:
        hospital = db.get(Hospital, mapping.hospital_id)
        if hospital:
            hospital_name = hospital.hospital_name
            hospital_license_number = hospital.license_number

    return {
        "id": doctor.id,
        "first_name": doctor.first_name,
        "middle_name": doctor.middle_name,
        "last_name": doctor.last_name,
        "gender": doctor.gender,
        "dob": doctor.dob,
        "aadhaar": decrypt_field(doctor.aadhaar_encrypted),
        "email": decrypt_field(doctor.email_encrypted),
        "phone": decrypt_field(doctor.phone_encrypted),
        "specialization": doctor.specialization,
        "license_number": doctor.license_number,
        "address": address,
        "is_active": doctor.is_active,
        "created_at": doctor.created_at,
        "hospital_name": hospital_name or "Not Assigned",
        "hospital_license_number": hospital_license_number,
        "approved_by": d.approved_by,
        "approved_at": d.approved_at,

    }
