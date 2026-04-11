# app/api/v1/doctor/change_password.py

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.core import crypto
from app.db import crud

router = APIRouter()

@router.post("/change-password")
def change_doctor_password(
    old_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    payload=Depends(require_role([Role.DOCTOR])),
    db = Depends(get_db),
):
    doctor_id = payload.get("doctor_id")
    if not doctor_id:
        raise HTTPException(401, "Doctor authentication required")

    doctor = crud.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(404, "Doctor not found")

    if not crypto.verify_password(old_password, doctor.password_hash):
        raise HTTPException(400, "Old password is incorrect")

    if old_password == new_password:
        raise HTTPException(400, "New password cannot be same as old password")

    if len(new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    new_hash = crypto.hash_password(new_password)
    crud.update_doctor_password(db, doctor_id, new_hash)

    return {"message": "Password updated successfully"}
