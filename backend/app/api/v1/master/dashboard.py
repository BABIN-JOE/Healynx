# app/api/v1/master/dashboard.py
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role

from app.db.models import Admin, Hospital, Doctor, Patient

router = APIRouter()


@router.get("/dashboard-stats")
def master_dashboard_stats(
    payload=Depends(require_role([Role.MASTER])),
    db = Depends(get_db),
):
    """
    Return simple counts for the master dashboard (uses COUNT for performance).
    """
    # Use SQL count to avoid loading whole tables
    total_admins = db.exec(select(func.count()).select_from(Admin)).one()
    total_hospitals = db.exec(select(func.count()).select_from(Hospital).where(Hospital.is_active == True)).one()
    total_doctors = db.exec(select(func.count()).select_from(Doctor).where(Doctor.is_active == True)).one()
    total_patients = db.exec(select(func.count()).select_from(Patient)).one()

    return {
        "total_admins": int(total_admins),
        "total_hospitals": int(total_hospitals),
        "total_doctors": int(total_doctors),
        "total_patients": int(total_patients),
    }
