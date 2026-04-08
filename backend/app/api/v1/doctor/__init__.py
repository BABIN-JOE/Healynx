from fastapi import APIRouter

from .register_doctor import router as register_router
from .dashboard import router as dashboard_router
from .join_hospital import router as join_router
from .update_contact import router as update_router
from .leave_hospital import router as leave_router
from .change_password import router as password_router
from .doctor_session import router as session_router

router = APIRouter(tags=["Doctors"])

router.include_router(register_router)
router.include_router(dashboard_router)
router.include_router(join_router)
router.include_router(update_router)
router.include_router(leave_router)
router.include_router(password_router)
router.include_router(session_router)
