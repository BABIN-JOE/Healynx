from fastapi import APIRouter

# Import sub-routers
from .access import router as access_router
from .entries import router as entries_router
from .records import router as records_router

# Main medical router
router = APIRouter()

# ---------------------------------------------------------
# Access control routes
# ---------------------------------------------------------
router.include_router(access_router)

# ---------------------------------------------------------
# Medical entry workflow (pending / approve / history)
# ---------------------------------------------------------
router.include_router(entries_router)

# ---------------------------------------------------------
# Approved medical records viewing
# ---------------------------------------------------------
router.include_router(records_router)

