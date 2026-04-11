from typing import Optional
from urllib.parse import unquote
from uuid import uuid4

import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlmodel import Session

from app.config import settings
from app.core import jwt_utils, security
from app.core.rate_limit import (
    clear_login_failures,
    record_login_failure,
    verify_rate_limit_login,
)
from app.core.time import days_from_now, ensure_utc, minutes_from_now, utcnow
from app.db import crud
from app.db.crud import refresh_token as refresh_crud
from app.db.crud import session as session_crud
from app.deps import get_db
from app.deps_auth import get_current_user, get_jwt_payload
from app.schemas import HospitalLoginSchema, LoginSchema

router = APIRouter()

COOKIE_MAP = {
    "master": "session_master",
    "admin": "session_admin",
    "hospital": "session_hospital",
    "doctor": "session_doctor",
}
REFRESH_COOKIE = "refresh_token"
CSRF_COOKIE = "csrf_token"


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _auth_cookie_kwargs(*, httponly: bool) -> dict:
    return {
        "httponly": httponly,
        "secure": settings.COOKIE_SECURE,
        "samesite": settings.COOKIE_SAMESITE,
        "path": "/",
    }


def _delete_cookie(response: Response, key: str) -> None:
    response.set_cookie(
        key=key,
        value="",
        path="/",
        httponly=key != CSRF_COOKIE,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=0,
        expires=0,
    )


def _clear_role_cookies(response: Response) -> None:
    for cookie in COOKIE_MAP.values():
        _delete_cookie(response, cookie)


def _clear_auth_cookies(response: Response) -> None:
    _clear_role_cookies(response)
    _delete_cookie(response, REFRESH_COOKIE)
    _delete_cookie(response, CSRF_COOKIE)


def set_auth_cookie(response: Response, role: str, token: str) -> None:
    response.set_cookie(
        key=COOKIE_MAP[role],
        value=token,
        **_auth_cookie_kwargs(httponly=True),
    )


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        **_auth_cookie_kwargs(httponly=True),
    )


def set_csrf_cookie(response: Response, csrf_token: str) -> None:
    response.set_cookie(
        key=CSRF_COOKIE,
        value=csrf_token,
        **_auth_cookie_kwargs(httponly=False),
    )


def _submitted_csrf_token(request: Request) -> str:
    cookie_token = request.cookies.get(CSRF_COOKIE)
    header_token = request.headers.get("X-CSRF-Token")

    if cookie_token:
        cookie_token = unquote(cookie_token)
    if header_token:
        header_token = unquote(header_token)

    if not cookie_token or not header_token:
        raise HTTPException(status_code=403, detail="CSRF missing")

    if cookie_token != header_token:
        raise HTTPException(status_code=403, detail="CSRF invalid")

    return cookie_token


def _get_refresh_record(db: Session, request: Request):
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    stored = refresh_crud.get_refresh_token(db, hash_token(token))
    if not stored:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return token, stored


def _resolve_session_for_request(request: Request, db: Session) -> Optional[object]:
    try:
        payload = get_jwt_payload(request, db)
        session_id = payload.get("session_id")
        if session_id:
            return session_crud.get_session(db, session_id)
    except HTTPException:
        pass

    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if refresh_token:
        stored = refresh_crud.get_refresh_token(db, hash_token(refresh_token))
        if stored:
            return session_crud.get_session(db, stored.session_id)

    return None


def verify_cookie_bound_csrf(request: Request, db: Session, *, require_session: bool) -> Optional[object]:
    submitted_token = _submitted_csrf_token(request)
    session = _resolve_session_for_request(request, db)

    if require_session and (not session or session.revoked):
        raise HTTPException(status_code=401, detail="Session invalid")

    if session and session.csrf_token != submitted_token:
        raise HTTPException(status_code=403, detail="CSRF mismatch")

    return session


def _issue_invalid_login(request: Request, identifier: str) -> None:
    record_login_failure(request, identifier)
    raise HTTPException(status_code=401, detail="Invalid credentials")


def issue_tokens(
    response: Response,
    db: Session,
    payload: dict,
    role: str,
    user_ids: dict,
    request: Request,
) -> None:
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    session_id = payload["session_id"]
    csrf_token = security.generate_csrf_token()

    session_crud.create_session(
        db,
        session_id=session_id,
        role=role,
        expires_at=minutes_from_now(settings.ACCESS_TOKEN_MINUTES),
        user_agent=user_agent,
        ip_address=ip_address,
        csrf_token=csrf_token,
        **user_ids,
    )

    access_token = jwt_utils.create_jwt(payload, minutes=settings.ACCESS_TOKEN_MINUTES)
    refresh_token = generate_refresh_token()

    refresh_crud.create_refresh_token(
        db,
        token_hash=hash_token(refresh_token),
        session_id=session_id,
        expires_at=days_from_now(settings.REFRESH_TOKEN_DAYS),
        role=role,
        user_agent=user_agent,
        ip_address=ip_address,
        **user_ids,
    )

    _clear_role_cookies(response)
    set_auth_cookie(response, role, access_token)
    set_refresh_cookie(response, refresh_token)
    set_csrf_cookie(response, csrf_token)
    response.headers["X-CSRF-Token"] = csrf_token


@router.get("/me")
def me(payload=Depends(get_current_user), db: Session = Depends(get_db)):
    response = JSONResponse(content=payload)
    session_id = payload.get("session_id")

    if session_id:
        session = session_crud.get_session(db, session_id)
        if session and not session.revoked:
            set_csrf_cookie(response, session.csrf_token)
            response.headers["X-CSRF-Token"] = session.csrf_token

    return response


@router.get("/csrf")
def get_csrf(request: Request, db: Session = Depends(get_db)):
    session = _resolve_session_for_request(request, db)
    if not session or session.revoked:
        raise HTTPException(status_code=401, detail="Session invalid")

    response = JSONResponse(content={"csrf_token": session.csrf_token})
    set_csrf_cookie(response, session.csrf_token)
    response.headers["X-CSRF-Token"] = session.csrf_token
    return response


@router.post("/master/login")
def master_login(request: Request, credentials: LoginSchema, db: Session = Depends(get_db)):
    identifier = credentials.username.strip().lower()
    verify_rate_limit_login(request, identifier)

    user = crud.get_master_by_username(db, credentials.username)
    if not user or not security.verify_password(user.password_hash, credentials.password):
        _issue_invalid_login(request, identifier)

    clear_login_failures(request, identifier)
    session_id = str(uuid4())
    payload = {
        "role": "master",
        "master_id": str(user.id),
        "session_id": session_id,
        "jti": str(uuid4()),
    }
    response = JSONResponse(content={"message": "Master login successful"})
    issue_tokens(response, db, payload, "master", {"user_id": user.id}, request)
    return response


@router.post("/admin/login")
def admin_login(request: Request, credentials: LoginSchema, db: Session = Depends(get_db)):
    identifier = credentials.username.strip().lower()
    verify_rate_limit_login(request, identifier)

    user = crud.get_admin_by_username(db, credentials.username)
    if not user or not security.verify_password(user.password_hash, credentials.password):
        _issue_invalid_login(request, identifier)

    clear_login_failures(request, identifier)
    session_id = str(uuid4())
    payload = {
        "role": "admin",
        "admin_id": str(user.id),
        "session_id": session_id,
        "jti": str(uuid4()),
    }
    response = JSONResponse(content={"message": "Admin login successful"})
    issue_tokens(response, db, payload, "admin", {"user_id": user.id}, request)
    return response


@router.post("/hospital/login")
def hospital_login(
    request: Request,
    credentials: HospitalLoginSchema,
    db: Session = Depends(get_db),
):
    identifier = credentials.license_number.strip().lower()
    verify_rate_limit_login(request, identifier)

    hospital = crud.get_hospital_by_license(db, credentials.license_number)
    if not hospital or not security.verify_password(hospital.password_hash, credentials.password):
        _issue_invalid_login(request, identifier)

    clear_login_failures(request, identifier)
    session_id = str(uuid4())
    payload = {
        "role": "hospital",
        "hospital_id": str(hospital.id),
        "session_id": session_id,
        "jti": str(uuid4()),
    }
    response = JSONResponse(content={"message": "Hospital login successful"})
    issue_tokens(response, db, payload, "hospital", {"hospital_id": hospital.id}, request)
    return response


@router.post("/doctor/login")
def doctor_login(request: Request, credentials: LoginSchema, db: Session = Depends(get_db)):
    identifier = credentials.username.strip().lower()
    verify_rate_limit_login(request, identifier)

    doctor = crud.get_doctor_by_license(db, credentials.username)
    if not doctor or not security.verify_password(doctor.password_hash, credentials.password):
        _issue_invalid_login(request, identifier)

    clear_login_failures(request, identifier)
    session_id = str(uuid4())
    payload = {
        "role": "doctor",
        "doctor_id": str(doctor.id),
        "session_id": session_id,
        "jti": str(uuid4()),
    }
    response = JSONResponse(content={"message": "Doctor login successful"})
    issue_tokens(response, db, payload, "doctor", {"doctor_id": doctor.id}, request)
    return response


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    verify_cookie_bound_csrf(request, db, require_session=True)
    _, stored = _get_refresh_record(db, request)

    if stored.revoked:
        refresh_crud.revoke_all_user_tokens(
            db,
            user_id=stored.user_id,
            doctor_id=stored.doctor_id,
            hospital_id=stored.hospital_id,
        )
        session_crud.revoke_session(db, stored.session_id)
        raise HTTPException(status_code=401, detail="Session compromised. Please login again.")

    if ensure_utc(stored.expires_at) < utcnow():
        raise HTTPException(status_code=401, detail="Expired refresh token")

    request_user_agent = request.headers.get("user-agent")
    if stored.user_agent and stored.user_agent != request_user_agent:
        raise HTTPException(status_code=403, detail="Device mismatch")

    session = session_crud.get_session(db, stored.session_id)
    if not session or session.revoked:
        raise HTTPException(status_code=401, detail="Session invalid")

    refresh_crud.revoke_refresh_token(db, hash_token(request.cookies[REFRESH_COOKIE]))
    new_token = generate_refresh_token()

    refresh_crud.create_refresh_token(
        db,
        token_hash=hash_token(new_token),
        session_id=str(session.id),
        expires_at=days_from_now(settings.REFRESH_TOKEN_DAYS),
        role=stored.role,
        user_id=stored.user_id,
        doctor_id=stored.doctor_id,
        hospital_id=stored.hospital_id,
        user_agent=stored.user_agent,
        ip_address=stored.ip_address,
    )

    session.expires_at = minutes_from_now(settings.ACCESS_TOKEN_MINUTES)
    db.add(session)
    db.commit()

    payload = {
        "role": session.role,
        "session_id": str(session.id),
    }

    if stored.role == "master":
        payload["master_id"] = str(stored.user_id)
    elif stored.role == "admin":
        payload["admin_id"] = str(stored.user_id)
    elif stored.role == "doctor":
        payload["doctor_id"] = str(stored.doctor_id)
    elif stored.role == "hospital":
        payload["hospital_id"] = str(stored.hospital_id)

    access_token = jwt_utils.create_jwt(payload, minutes=settings.ACCESS_TOKEN_MINUTES)

    _clear_role_cookies(response)
    set_auth_cookie(response, stored.role, access_token)
    set_refresh_cookie(response, new_token)
    set_csrf_cookie(response, session.csrf_token)
    response.headers["X-CSRF-Token"] = session.csrf_token

    return {"message": "Refreshed"}


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    response = JSONResponse(content={"message": "Logged out successfully"})
    _clear_auth_cookies(response)

    try:
        refresh_token = request.cookies.get(REFRESH_COOKIE)
        if refresh_token:
            stored = refresh_crud.get_refresh_token(db, hash_token(refresh_token))
            if stored:
                refresh_crud.revoke_refresh_token(db, hash_token(refresh_token))
                if stored.session_id:
                    session_crud.revoke_session(db, stored.session_id)

        try:
            payload = get_jwt_payload(request, db)
            session_id = payload.get("session_id")
            if session_id:
                session_crud.revoke_session(db, session_id)
        except HTTPException:
            session = _resolve_session_for_request(request, db)
            if session:
                session_crud.revoke_session(db, session.id)

        db.commit()
    except Exception:
        db.rollback()

    return response
