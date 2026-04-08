# app/api/v1/hospital/router.py

from fastapi import APIRouter

from .dashboard import router as dashboard_router
from .hospital_profile import router as profile_router
from .list_doctors import router as list_doctors_router
from .get_doctor import router as get_doctor_router
from .remove_doctor import router as remove_doctor_router

from .doctor_join_requests import router as doctor_join_requests_router
from .get_doctor_join_request import router as get_doctor_join_request_router
from .approve_doctor_join import router as approve_doctor_join_router
from .decline_doctor_join import router as decline_doctor_join_router

from .patient_access_requests import router as patient_access_requests_router
from .pending_entries import router as pending_entries_router
from .change_password import router as change_password_router
from .hospital_register import router as register_router
from .patient_update_requests import router as update_router

router = APIRouter(tags=["Hospital"])

# -----------------------
# PUBLIC
# -----------------------
router.include_router(register_router)

# -----------------------
# PROTECTED
# -----------------------
router.include_router(dashboard_router)
router.include_router(profile_router)

# Doctors (IMPORTANT)
router.include_router(list_doctors_router)      # GET /hospital/doctors
router.include_router(get_doctor_router)        # GET /hospital/doctors/{id}
router.include_router(remove_doctor_router)     # POST /hospital/doctors/{id}/soft-delete

# Doctor Join Requests
router.include_router(doctor_join_requests_router)
router.include_router(get_doctor_join_request_router)
router.include_router(approve_doctor_join_router)
router.include_router(decline_doctor_join_router)

# Patient & Medical
router.include_router(patient_access_requests_router)
router.include_router(pending_entries_router)

router.include_router(change_password_router)

router.include_router(update_router)

