# app/deps_auth.py

from fastapi import Request, HTTPException, Depends, status
from typing import List, Optional
from sqlmodel import Session

from app.deps import get_db
from app.core import jwt_utils
from app.core.rbac import Role
from app.core.time import utcnow, ensure_utc
from app.db.crud import session as session_crud

DEBUG_AUTH = False

# Cookie priority for authentication
COOKIE_PRIORITY = (
    "session_master",
    "session_admin",
    "session_hospital",
    "session_doctor",
)


# ---------------------------------------------------
# 🔐 CORE AUTH FUNCTION
# ---------------------------------------------------
def get_jwt_payload(request: Request, db: Session = Depends(get_db)) -> dict:
    """
    Extract and validate JWT payload from cookies.
    Ensures the session is active, not revoked, and not expired.
    """

    if DEBUG_AUTH:
        print("INCOMING COOKIES:", request.cookies)

    for cookie_name in COOKIE_PRIORITY:
        token: Optional[str] = request.cookies.get(cookie_name)

        if not token:
            continue

        try:
            payload = jwt_utils.decode_jwt(token)

            session_id = payload.get("session_id")
            if not session_id:
                continue

            session = session_crud.get_session(db, session_id)

            # ❌ Session not found
            if not session:
                continue

            # ❌ Revoked session
            if session.revoked:
                continue

            # ❌ Expired session
            if ensure_utc(session.expires_at) < utcnow():
                continue

            # 🔒 User-Agent validation (anti-session hijacking)
            request_ua = request.headers.get("user-agent")
            if session.user_agent and session.user_agent != request_ua:
                session_crud.revoke_session(db, session.id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session hijacked",
                )

            if DEBUG_AUTH:
                print("JWT PAYLOAD:", payload)

            return payload

        except Exception as e:
            if DEBUG_AUTH:
                print("JWT ERROR:", e)
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


# ---------------------------------------------------
# 🔐 ROLE GUARD
# ---------------------------------------------------
def require_role(allowed_roles: List[Role]):
    """
    Dependency to enforce role-based access control.
    """

    def role_checker(payload: dict = Depends(get_jwt_payload)):
        user_role = payload.get("role")

        allowed = [
            r.value if hasattr(r, "value") else r
            for r in allowed_roles
        ]

        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        return payload

    return role_checker


# ---------------------------------------------------
# 🔐 CSRF PROTECTION
# ---------------------------------------------------
def verify_csrf(request: Request, db: Session) -> None:
    """
    Validates CSRF token using:
    1. Cookie token
    2. Header token
    3. Token stored in the database session
    """

    cookie_token = request.cookies.get("csrf_token")
    header_token = request.headers.get("X-CSRF-Token")

    if DEBUG_AUTH:
        print("CSRF COOKIE:", cookie_token)
        print("CSRF HEADER:", header_token)

    # ❌ Missing tokens
    if not cookie_token or not header_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF missing",
        )

    # ❌ Cookie/Header mismatch
    if cookie_token != header_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF mismatch",
        )

    # Validate JWT and session
    payload = get_jwt_payload(request, db)
    session_id = payload.get("session_id")

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid session",
        )

    session = session_crud.get_session(db, session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session not found",
        )

    # ❌ Database token mismatch
    if session.csrf_token != cookie_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF invalid",
        )

    if DEBUG_AUTH:
        print("CSRF validation successful")


# ---------------------------------------------------
# 🔐 CURRENT USER
# ---------------------------------------------------
def get_current_user(payload: dict = Depends(get_jwt_payload)):
    """
    Returns the authenticated user's payload.
    """
    return payload