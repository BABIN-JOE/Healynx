# app/api/v1/master/delete_admin.py

from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from sqlmodel import Session

from app.deps import get_db
from app.core.rbac import Role
from app.deps_auth import require_role
from app.db.models import Admin, Doctor, Hospital

router = APIRouter()

@router.delete("/admins/{admin_id}")
def delete_admin(
    admin_id: UUID,
    db: Session = Depends(get_db),
    payload=Depends(require_role([Role.MASTER])),
):
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(404, "Admin not found")

    # Clear the approved_by reference from all hospitals and doctors before deleting.
    # This removes foreign key constraints that would otherwise prevent deletion.
    hospitals = db.query(Hospital).filter(Hospital.approved_by == admin_id).all()
    for hospital in hospitals:
        hospital.approved_by = None

    doctors = db.query(Doctor).filter(Doctor.approved_by == admin_id).all()
    for doctor in doctors:
        doctor.approved_by = None

    # Hard delete - remove admin from database completely
    db.delete(admin)
    db.commit()

    return {"message": "Admin deleted successfully", "id": admin.id}
