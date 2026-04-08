from fastapi import APIRouter

from app.api.v1.admin.hospital.list_hospital_requests import router as list_hospital_requests_router
from app.api.v1.admin.hospital.get_hospital_request import router as get_hospital_request_router
from app.api.v1.admin.hospital.approve_hospital import router as approve_hospital_router
from app.api.v1.admin.hospital.reject_hospital import router as reject_hospital_router
from app.api.v1.admin.hospital.delete_hospital import router as delete_hospital_router

from app.api.v1.admin.doctor.list_doctor_requests import router as list_doctor_requests_router
from app.api.v1.admin.doctor.approve_doctor import router as approve_doctor_router
from app.api.v1.admin.doctor.reject_doctor import router as reject_doctor_router
from app.api.v1.admin.doctor.delete_doctor import router as delete_doctor_router
from app.api.v1.admin.doctor.update_doctor import router as update_doctor_router

from app.api.v1.admin.patient.add_patient import router as add_patient_router
from app.api.v1.admin.patient.update_patient import router as update_patient_router

from app.api.v1.admin.change_password import router as change_password_router

from .hospital.list_hospitals import router as list_hospitals_router
from .hospital.get_hospital import router as get_hospital_router
from .hospital.block_hospital import router as block_hospital_router
from .hospital.unblock_hospital import router as unblock_hospital_router
from .hospital.update_hospital import router as update_hospital_router

from .doctor.list_doctors import router as list_doctors_router
from .doctor.get_doctor import router as get_doctor_router
from app.api.v1.admin.doctor.block_doctor import router as block_doctor_router
from app.api.v1.admin.doctor.unblock_doctor import router as unblock_doctor_router
from app.api.v1.admin.doctor.get_doctor_request import router as get_doctor_request_router

from .patient.list_patients import router as list_patients_router
from .patient.get_patient import router as get_patient_router

from .dashboard import router as dashboard_router

router = APIRouter(tags=["Admin"])

router.include_router(list_hospital_requests_router)
router.include_router(get_hospital_request_router)
router.include_router(approve_hospital_router)
router.include_router(reject_hospital_router)
router.include_router(delete_hospital_router)

router.include_router(list_doctor_requests_router)
router.include_router(approve_doctor_router)
router.include_router(reject_doctor_router)
router.include_router(delete_doctor_router)

router.include_router(add_patient_router)
router.include_router(update_patient_router)

router.include_router(change_password_router)

router.include_router(list_hospitals_router)
router.include_router(get_hospital_router)
router.include_router(block_hospital_router)
router.include_router(unblock_hospital_router)
router.include_router(update_hospital_router)

router.include_router(list_doctors_router)
router.include_router(get_doctor_router)
router.include_router(block_doctor_router)
router.include_router(unblock_doctor_router)
router.include_router(get_doctor_request_router)
router.include_router(update_doctor_router)

router.include_router(list_patients_router)
router.include_router(get_patient_router)

router.include_router(dashboard_router)
