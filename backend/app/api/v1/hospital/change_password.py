from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import crud
from app.core import crypto

router = APIRouter()

@router.post("/change-password")
def change_hospital_password(
    old_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    payload=Depends(require_role([Role.HOSPITAL])),
    db = Depends(get_db),
):
    hospital_id = payload["hospital_id"]

    hospital = crud.get_hospital(db, hospital_id)
    if not hospital:
        raise HTTPException(404, "Hospital not found")

    if not crypto.verify_password(old_password, hospital.password_hash):
        raise HTTPException(400, "Old password is incorrect")

    if old_password == new_password:
        raise HTTPException(400, "New password cannot be same as old password")

    if len(new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    new_hash = crypto.hash_password(new_password)
    crud.update_hospital_password(db, hospital_id, new_hash)

    return {"message": "Password updated successfully"}
