# app/api/v1/master/change_password.py

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db import crud
from app.core import crypto

router = APIRouter()

@router.post("/change-password")
def change_master_password(
    old_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    payload=Depends(require_role([Role.MASTER])),
    db = Depends(get_db),
):
    master_id = payload["user_id"]

    master = crud.get_master(db, master_id)
    if not master:
        raise HTTPException(404, "Master not found")

    if not crypto.verify_password(old_password, master.password_hash):
        raise HTTPException(400, "Old password is incorrect")

    if old_password == new_password:
        raise HTTPException(400, "New password cannot be same as old password")

    if len(new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    new_hash = crypto.hash_password(new_password)
    crud.update_master_password(db, master_id, new_hash)

    return {"message": "Password updated successfully"}