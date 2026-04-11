# app/api/v1/master/block_admin.py

from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.db.models import Admin

router = APIRouter()

@router.post("/admins/{admin_id}/block")
def block_admin(
    admin_id: UUID,
    db = Depends(get_db),
    payload=Depends(require_role([Role.MASTER])),
):
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(404, "Admin not found")

    admin.is_blocked = True
    db.commit()

    return {"message": "Admin blocked", "id": str(admin.id)}
