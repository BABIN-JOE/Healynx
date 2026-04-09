# app/api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlmodel import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import timedelta
from uuid import uuid4

import hashlib
import secrets
import os

from app.db import crud
from app.db.crud import session as session_crud
from app.db.crud import refresh_token as refresh_crud

from app.deps_auth import get_jwt_payload, get_current_user, verify_csrf
from app.core import security, jwt_utils
from app.deps import get_db
from app.core.time import utcnow, ensure_utc
from app.core.rate_limit import verify_rate_limit_login
from app.schemas import LoginSchema, HospitalLoginSchema

router = APIRouter()

COOKIE_MAP = {
    "master": "session_master",
    "admin": "session_admin",
    "hospital": "session_hospital",
    "doctor": "session_doctor",
}

REFRESH_COOKIE = "refresh_token"

ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", 15))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", 7))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false") == "true"


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------
def generate_refresh_token():
    return secrets.token_urlsafe(64)


def hash_token(token: str):
    return hashlib.sha256(token.encode()).hexdigest()


def set_auth_cookie(response: Response, role: str, token: str):
    response.set_cookie(
        key=COOKIE_MAP[role],
        value=token,
        httponly=True,
        secure=True,          # Must be True in production
        samesite="None",      # Required for cross-site cookies
        path="/"
    )


def set_refresh_cookie(response: Response, token: str):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/"
    )


def set_csrf_cookie(response: Response, csrf_token: str):
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=True,
        samesite="None",
        path="/"
    )


def issue_tokens(response, db, payload, role, user_ids, request: Request):
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host

    session_id = payload["session_id"]

    csrf_token = security.generate_csrf_token()

    session_crud.create_session(
        db,
        session_id=session_id,
        role=role,
        expires_at=ensure_utc(utcnow() + timedelta(minutes=ACCESS_TOKEN_MINUTES)),
        user_agent=user_agent,
        ip_address=ip_address,
        csrf_token=csrf_token,
        **user_ids
    )

    access_token = jwt_utils.create_jwt(payload, minutes=ACCESS_TOKEN_MINUTES)

    refresh_token = generate_refresh_token()

    # 🔥 STORE session_id WITH REFRESH TOKEN
    refresh_crud.create_refresh_token(
        db,
        token_hash=hash_token(refresh_token),
        session_id=session_id,
        expires_at=ensure_utc(utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)),
        role=role,
        user_agent=user_agent,
        ip_address=ip_address,
        **user_ids
    )

    set_auth_cookie(response, role, access_token)
    set_refresh_cookie(response, refresh_token)
    set_csrf_cookie(response, csrf_token)


# ---------------------------------------------------------
# /me
# ---------------------------------------------------------
@router.get("/me")
def me(
    payload = Depends(get_current_user),
    db = Depends(get_db)   # ✅ remove Session type
):
    return payload


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------

@router.post("/master/login")
def master_login(request: Request, credentials: LoginSchema, db = Depends(get_db)):
    user = crud.get_master_by_username(db, credentials.username)

    if not user or not security.verify_password(user.password_hash, credentials.password):
        raise HTTPException(401, "Invalid credentials")

    session_id = str(uuid4())

    payload = {
        "role": "master",
        "master_id": str(user.id),
        "session_id": session_id,
        "jti": str(uuid4())
    }

    response = JSONResponse(content={"message": "Master login successful"})

    issue_tokens(response, db, payload, "master", {"user_id": user.id}, request)

    return response


@router.post("/admin/login")
def admin_login(request: Request, credentials: LoginSchema, db = Depends(get_db)):
    verify_rate_limit_login(request)

    user = crud.get_admin_by_username(db, credentials.username)

    if not user or not security.verify_password(user.password_hash, credentials.password):
        raise HTTPException(401, "Invalid credentials")

    session_id = str(uuid4())

    payload = {
        "role": "admin",
        "admin_id": str(user.id),
        "session_id": session_id,
        "jti": str(uuid4())
    }

    response = JSONResponse(content={"message": "Admin login successful"})

    issue_tokens(response, db, payload, "admin", {"user_id": user.id}, request)

    return response


@router.post("/hospital/login")
def hospital_login(request: Request, credentials: HospitalLoginSchema, db = Depends(get_db)):
    hospital = crud.get_hospital_by_license(db, credentials.license_number)

    if not hospital or not security.verify_password(hospital.password_hash, credentials.password):
        raise HTTPException(401, "Invalid credentials")

    session_id = str(uuid4())

    payload = {
        "role": "hospital",
        "hospital_id": str(hospital.id),
        "session_id": session_id,
        "jti": str(uuid4())
    }

    response = JSONResponse(content={"message": "Hospital login successful"})

    issue_tokens(response, db, payload, "hospital", {"hospital_id": hospital.id}, request)

    return response


@router.post("/doctor/login")
def doctor_login(request: Request, credentials: LoginSchema, db = Depends(get_db)):
    verify_rate_limit_login(request)

    doc = crud.get_doctor_by_license(db, credentials.username)

    if not doc or not security.verify_password(doc.password_hash, credentials.password):
        raise HTTPException(401, "Invalid credentials")

    session_id = str(uuid4())

    payload = {
        "role": "doctor",
        "doctor_id": str(doc.id),
        "session_id": session_id,
        "jti": str(uuid4())
    }

    response = JSONResponse(content={"message": "Doctor login successful"})

    issue_tokens(response, db, payload, "doctor", {"doctor_id": doc.id}, request)

    return response


# ---------------------------------------------------------
# REFRESH (SECURE VERSION)
# ---------------------------------------------------------
@router.post("/refresh")
def refresh(request: Request, response: Response, db = Depends(get_db)):

    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(401, "No refresh token")

    token_hash = hash_token(token)

    stored = refresh_crud.get_refresh_token(db, token_hash)

    # ❌ INVALID TOKEN
    if not stored:
        raise HTTPException(401, "Invalid refresh token")

    # 🔥 TOKEN REUSE DETECTED (CRITICAL FIX)
    if stored.revoked:
        # 🚨 possible attack → revoke all sessions
        refresh_crud.revoke_all_user_tokens(
            db,
            user_id=stored.user_id,
            doctor_id=stored.doctor_id
        )

        # (optional but recommended)
        session_crud.revoke_session(db, stored.session_id)

        raise HTTPException(401, "Session compromised. Please login again.")

    # ❌ EXPIRED
    if ensure_utc(stored.expires_at) < utcnow():
        raise HTTPException(401, "Expired refresh token")

    # ❌ DEVICE MISMATCH
    if stored.user_agent != request.headers.get("user-agent"):
        raise HTTPException(403, "Device mismatch")

    # 🔥 GET SESSION
    session = session_crud.get_session(db, stored.session_id)

    if not session or session.revoked:
        raise HTTPException(401, "Session invalid")

    # 🔁 ROTATE REFRESH TOKEN
    refresh_crud.revoke_refresh_token(db, token_hash)

    new_token = generate_refresh_token()

    refresh_crud.create_refresh_token(
        db,
        token_hash=hash_token(new_token),
        session_id=session.id,
        expires_at=ensure_utc(utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)),
        role=stored.role,
        user_id=stored.user_id,
        doctor_id=stored.doctor_id,
        hospital_id=stored.hospital_id,
        user_agent=stored.user_agent,
        ip_address=stored.ip_address
    )

    # ⏱️ extend session
    session.expires_at = ensure_utc(
        utcnow() + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    )
    db.add(session)
    db.commit()

    # 🔐 new access token
    payload = {
        "role": stored.role,
        "session_id": session.id,
        "jti": str(uuid4())
    }

    if stored.role == "master":
        payload["master_id"] = str(stored.user_id)
    elif stored.role == "admin":
        payload["admin_id"] = str(stored.user_id)
    elif stored.role == "doctor":
        payload["doctor_id"] = str(stored.doctor_id)
    elif stored.role == "hospital":
        payload["hospital_id"] = str(stored.hospital_id)

    access_token = jwt_utils.create_jwt(payload, minutes=ACCESS_TOKEN_MINUTES)

    set_auth_cookie(response, stored.role, access_token)
    set_refresh_cookie(response, new_token)
    set_csrf_cookie(response, session.csrf_token)

    return {"message": "Refreshed"}


# ---------------------------------------------------------
# LOGOUT
# ---------------------------------------------------------
@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    verify_csrf(request, db) 

    try:
        for cookie in COOKIE_MAP.values():
            response.delete_cookie(
                key=cookie,
                path="/"
            )

        response.delete_cookie(
            key=REFRESH_COOKIE,
            path="/"
        )

        response.delete_cookie(
            key="csrf_token",
            path="/"
        )

        refresh_token = request.cookies.get(REFRESH_COOKIE)

        if refresh_token:
            try:
                refresh_crud.revoke_refresh_token(db, hash_token(refresh_token))
            except:
                db.rollback()

        try:
            payload = get_jwt_payload(request, db)
            session_id = payload.get("session_id")
            if session_id:
                session_crud.revoke_session(db, session_id)
        except:
            pass

        db.commit()

        return {"message": "Logged out"}

    except Exception:
        db.rollback()
        raise HTTPException(500, "Logout failed")