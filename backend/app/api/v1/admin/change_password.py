#api/v1/admin/change_password.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.core import security
from app.db.models import Admin as AdminModel

router = APIRouter()

@router.post("/change-password")
def change_password(
    old_password: str,
    new_password: str,
    payload=Depends(require_role([Role.ADMIN])),
    db = Depends(get_db),
):
    admin = db.get(AdminModel, payload["user_id"])

    if not admin:
        raise HTTPException(404, "Admin not found")

    if not security.verify_password(admin.password_hash, old_password):
        raise HTTPException(401, "Invalid current password")

    admin.password_hash = security.hash_password(new_password)
    db.commit()

    return {"message": "Password changed"}
