# app/deps_auth.py

from fastapi import Request, HTTPException, Depends
from typing import List, Optional
from sqlmodel import Session

from app.deps import get_db
from app.core import jwt_utils
from app.core.rbac import Role
from app.core.time import utcnow, ensure_utc
from app.db.crud import session as session_crud

DEBUG_AUTH = False

COOKIE_PRIORITY = (
    "session_master",
    "session_admin",
    "session_hospital",
    "session_doctor",
)


# ---------------------------------------------------
# 🔐 CORE AUTH FUNCTION (UPDATED)
# ---------------------------------------------------
def get_jwt_payload(request: Request, db: Session = Depends(get_db)) -> dict:
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

            # ❌ session not found
            if not session:
                continue

            # ❌ revoked
            if session.revoked:
                continue

            # ❌ expired
            if ensure_utc(session.expires_at) < utcnow():
                continue

            # 🔥 NEW: USER-AGENT CHECK (ANTI HIJACK)
            request_ua = request.headers.get("user-agent")
            if session.user_agent and session.user_agent != request_ua:
                # revoke immediately
                session_crud.revoke_session(db, session.id)
                raise HTTPException(401, "Session hijacked")

            # ✅ VALID SESSION
            if DEBUG_AUTH:
                print("JWT PAYLOAD:", payload)

            return payload

        except Exception as e:
            if DEBUG_AUTH:
                print("JWT ERROR:", e)
            continue

    raise HTTPException(401, "Not authenticated")


# ---------------------------------------------------
# 🔐 ROLE GUARD
# ---------------------------------------------------
def require_role(allowed_roles: List[Role]):
    def role_checker(payload: dict = Depends(get_jwt_payload)):
        user_role = payload.get("role")

        allowed = [
            r.value if hasattr(r, "value") else r
            for r in allowed_roles
        ]

        if user_role not in allowed:
            raise HTTPException(403, "Access denied")

        return payload

    return role_checker


# ---------------------------------------------------
# 🔐 CSRF PROTECTION (UPDATED)
# ---------------------------------------------------
def verify_csrf(
    request: Request,
    db: Session = Depends(get_db)
):
    cookie_token = request.cookies.get("csrf_token")
    header_token = request.headers.get("X-CSRF-Token")

    if not cookie_token or not header_token:
        raise HTTPException(403, "CSRF missing")

    payload = get_jwt_payload(request, db)
    session = session_crud.get_session(db, payload["session_id"])

    if not session:
        raise HTTPException(403, "Invalid session")

    if session.csrf_token != header_token:
        raise HTTPException(403, "CSRF invalid")


# ---------------------------------------------------
# 🔐 CURRENT USER
# ---------------------------------------------------
def get_current_user(payload: dict = Depends(get_jwt_payload)):
    return payload