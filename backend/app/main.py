# app/main.py

import time
import logging
from collections import defaultdict, deque
from typing import Dict
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlmodel import SQLModel, Session
from app.db import models

from app.db.engine import engine
from app.db.crud.medical.pending import cleanup_doctor_visible_entries
from app.core import validators
from app.core.validators import validate_address_object

from dotenv import load_dotenv
load_dotenv()

# -------------------------------------------------------
# FastAPI App
# -------------------------------------------------------
app = FastAPI(
    title="Healynx API",
    version="1.0.0",
    description="Secure Medical Data Platform",
    redirect_slashes=False
)

# -------------------------------------------------------
# Routers
# -------------------------------------------------------
from app.api.v1.master.router import router as master_router
from app.api.v1.admin.router import router as admin_router
from app.api.v1.hospital.router import router as hospital_router
from app.api.v1.doctor import router as doctor_router
from app.api.v1 import auth, patients, attachments
from app.api.v1.medical.router import router as medical_router

# -------------------------------------------------------
# Logger
# -------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healynx")

FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

# -------------------------------------------------------
# CORS
# -------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://healynx-med.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
    ],
)

# -------------------------------------------------------
# Security Headers Middleware
# -------------------------------------------------------
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# -------------------------------------------------------
# Rate Limiter
# -------------------------------------------------------
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_FAILURES = 12
RATE_LIMIT_BLOCK_SECONDS = 300

_failure_store: Dict[str, deque] = defaultdict(deque)
_blocked_until: Dict[str, float] = {}

def _rl_key(ip: str, path: str) -> str:
    return f"{ip}:{path}"

def record_validation_failure(ip: str, path: str):
    key = _rl_key(ip, path)
    now = time.time()
    dq = _failure_store[key]

    while dq and dq[0] < now - RATE_LIMIT_WINDOW_SECONDS:
        dq.popleft()

    dq.append(now)

    if len(dq) >= RATE_LIMIT_MAX_FAILURES:
        _blocked_until[key] = now + RATE_LIMIT_BLOCK_SECONDS
        logger.warning("Rate limiter blocking ip=%s path=%s", ip, path)

def is_blocked(ip: str, path: str) -> bool:
    key = _rl_key(ip, path)
    until = _blocked_until.get(key)

    if not until:
        return False

    if time.time() > until:
        del _blocked_until[key]
        _failure_store[key].clear()
        return False

    return True

# -------------------------------------------------------
# Validation Rules
# -------------------------------------------------------
VALIDATION_RULES = {
    ("POST", "/api/v1/master/admins/create"): [
        ("first_name", validators.validate_name),
        ("last_name", validators.validate_name),
        ("gender", lambda v: v in ("male", "female", "other") or (_ for _ in ()).throw(ValueError("invalid gender"))),
        ("dob", validators.validate_dob),
        ("aadhaar", validators.validate_aadhaar),
        ("phone", validators.validate_phone),
        ("email", validators.validate_email),
        ("address", validate_address_object),
        ("username", lambda v: v.strip() or (_ for _ in ()).throw(ValueError("username required"))),
        ("password", validators.validate_password),
    ],
}

# -------------------------------------------------------
# VALIDATION MIDDLEWARE
# -------------------------------------------------------
@app.middleware("http")
async def validation_middleware(request: Request, call_next):

    method = request.method
    path = request.url.path

    if method in ("GET", "HEAD"):
        return await call_next(request)

    if path.startswith("/api/v1/auth"):
        return await call_next(request)

    if path.startswith(("/docs", "/openapi.json", "/redoc", "/static")):
        return await call_next(request)

    if "application/json" not in request.headers.get("content-type", ""):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"

    if is_blocked(client_ip, path):
        return JSONResponse(status_code=429, content={"error": "Too many invalid requests"})

    rule = VALIDATION_RULES.get((method, path))

    if not rule:
        return await call_next(request)

    try:
        body = await request.json()
    except Exception:
        record_validation_failure(client_ip, path)
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    for field_name, validator_fn in rule:
        if field_name not in body:
            record_validation_failure(client_ip, path)
            return JSONResponse(status_code=400, content={"error": f"{field_name} is required"})

        try:
            validator_fn(body[field_name])
        except Exception as e:
            record_validation_failure(client_ip, path)
            return JSONResponse(status_code=400, content={"error": str(e)})

    return await call_next(request)

# -------------------------------------------------------
# Startup
# -------------------------------------------------------
@app.on_event("startup")
def on_startup():
    logger.info("Ensuring database tables exist...")
    SQLModel.metadata.create_all(engine)
    logger.info("Database ready.")

@app.on_event("startup")
def startup_cleanup():
    with Session(engine) as session:
        cleanup_doctor_visible_entries(session)

# -------------------------------------------------------
# Routers
# -------------------------------------------------------
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(master_router, prefix="/api/v1/master")
app.include_router(admin_router, prefix="/api/v1/admin")
app.include_router(hospital_router, prefix="/api/v1/hospital")
app.include_router(doctor_router, prefix="/api/v1/doctor")
app.include_router(medical_router, prefix="/api/v1/medical")
app.include_router(patients.router, prefix="/api/v1/patients")
app.include_router(attachments.router, prefix="/api/v1/attachments")

# -------------------------------------------------------
# Root
# -------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Healynx API is running"}