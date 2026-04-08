# app/api/v1/master/delete_admin.py

from fastapi import APIRouter, Depends, HTTPException, Request
from uuid import UUID
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role, verify_csrf
from app.core.rbac import Role
from app.db.models import Admin

router = APIRouter()

@router.delete("/admins/{admin_id}")
def delete_admin(
    admin_id: UUID,
    db = Depends(get_db),
    payload=Depends(require_role([Role.MASTER])),
    request: Request = None,
):
    verify_csrf(request, db) 
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(404, "Admin not found")

    admin.is_active = False
    db.commit()

    return {"message": "Admin soft deleted", "id": admin.id}
