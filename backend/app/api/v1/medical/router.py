from fastapi import APIRouter

from .access import router as access_router
from .entries import router as entries_router
from .records import router as records_router

router = APIRouter()

# -----------------------------
# Include all medical subroutes
# -----------------------------

router.include_router(access_router)
router.include_router(entries_router)
router.include_router(records_router)
