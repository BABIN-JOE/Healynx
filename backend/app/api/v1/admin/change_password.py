#api/v1/admin/change_password.py

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.core import crypto
from app.db.models import Admin as AdminModel
from app.db import crud

router = APIRouter()

@router.post("/change-password")
def change_password(
    old_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    admin = db.get(AdminModel, payload["admin_id"])

    if not admin:
        raise HTTPException(404, "Admin not found")

    if not crypto.verify_password(old_password, admin.password_hash):
        raise HTTPException(400, "Old password is incorrect")

    if old_password == new_password:
        raise HTTPException(400, "New password cannot be same as old password")

    if len(new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    new_hash = crypto.hash_password(new_password)
    crud.update_admin_password(db, payload["admin_id"], new_hash)

    return {"message": "Password updated successfully"}
