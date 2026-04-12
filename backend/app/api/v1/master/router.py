# app/api/v1/master/router.py

from fastapi import APIRouter

from .create_admin import router as create_router
from .list_admins import router as list_router
from .search_admins import router as search_router
from .get_admin import router as get_router
from .update_admin import router as update_router
from .block_admin import router as block_router
from .unblock_admin import router as unblock_router
from .delete_admin import router as delete_router
from .dashboard import router as dashboard_router
from .change_password import router as change_password_router

router = APIRouter(tags=["Master"])

# include all sub-routes
router.include_router(create_router)
router.include_router(list_router)
router.include_router(search_router)
router.include_router(get_router)
router.include_router(update_router)
router.include_router(block_router)
router.include_router(unblock_router)
router.include_router(delete_router)
router.include_router(dashboard_router)
router.include_router(change_password_router)
