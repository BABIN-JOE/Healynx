# app/api/v1/doctor/update_contact.py

from fastapi import APIRouter, Depends, Body, HTTPException, Request
from sqlmodel import Session
from app.deps import get_db
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import Doctor, HospitalDoctorMap
from app.core import crypto
from app.core.audit import log_action

router = APIRouter()

@router.put("/me/contact")
def update_contact(
    phone: str = Body(None),
    email: str = Body(None),
    address: str = Body(None),
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):
    doctor_id = payload.get("doctor_id")
    doctor = db.get(Doctor, doctor_id)

    if phone:
        doctor.phone_encrypted = crypto.aesgcm_encrypt_str(phone)
    if email:
        doctor.email_encrypted = crypto.aesgcm_encrypt_str(email)
    if address:
        doctor.address_encrypted = crypto.aesgcm_encrypt_str(address)

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return {"message": "Contact updated"}
