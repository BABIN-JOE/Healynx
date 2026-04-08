# app/api/v1/admin/dashboard.py
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.core.rbac import Role
from app.db.models import HospitalRequest, DoctorRequest, Hospital, Doctor, Patient

router = APIRouter()


@router.get("/dashboard-stats")
def admin_dashboard_stats(
    db = Depends(get_db),
    payload = Depends(require_role([Role.ADMIN]))
):
    pending_hospitals = db.exec(select(func.count()).select_from(HospitalRequest).where(HospitalRequest.status == "pending")).one()
    pending_doctors = db.exec(select(func.count()).select_from(DoctorRequest).where(DoctorRequest.status == "pending")).one()
    total_hospitals = db.exec(select(func.count()).select_from(Hospital).where(Hospital.is_active == True)).one()
    total_doctors = db.exec(select(func.count()).select_from(Doctor).where(Doctor.is_active == True)).one()
    total_patients = db.exec(select(func.count()).select_from(Patient)).one()

    return {
        "pending_hospitals": int(pending_hospitals),
        "pending_doctors": int(pending_doctors),
        "total_hospitals": int(total_hospitals),
        "total_doctors": int(total_doctors),
        "total_patients": int(total_patients),
    }
