from typing import List, Optional
from urllib.parse import unquote

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session

from app.core import jwt_utils
from app.core.rbac import Role
from app.core.time import ensure_utc, utcnow
from app.db.crud import session as session_crud
from app.deps import get_db

COOKIE_PRIORITY = (
    "session_master",
    "session_admin",
    "session_hospital",
    "session_doctor",
)
AUTH_COOKIE_NAMES = COOKIE_PRIORITY + ("refresh_token",)


def get_jwt_payload(request: Request, db: Session = Depends(get_db)) -> dict:
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
            if not session or session.revoked:
                continue

            if ensure_utc(session.expires_at) < utcnow():
                continue

            request_ua = request.headers.get("user-agent")
            if session.user_agent and session.user_agent != request_ua:
                session_crud.revoke_session(db, session.id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session hijacked",
                )

            return payload
        except Exception:
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


def require_role(allowed_roles: List[Role]):
    def role_checker(payload: dict = Depends(get_jwt_payload)):
        user_role = payload.get("role")
        allowed = [r.value if hasattr(r, "value") else r for r in allowed_roles]

        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        return payload

    return role_checker


def request_has_auth_cookie(request: Request) -> bool:
    return any(request.cookies.get(cookie_name) for cookie_name in AUTH_COOKIE_NAMES)


def _extract_csrf_tokens(request: Request) -> tuple[str, str]:
    """Extract CSRF tokens from request without validation."""
    cookie_token = request.cookies.get("csrf_token")
    header_token = request.headers.get("X-CSRF-Token")

    if cookie_token:
        cookie_token = unquote(cookie_token)

    if header_token:
        header_token = unquote(header_token)

    if not cookie_token or not header_token:
        raise HTTPException(status_code=403, detail="CSRF missing")

    if cookie_token != header_token:
        raise HTTPException(status_code=403, detail="CSRF invalid")

    return cookie_token, header_token


def verify_csrf_tokens_direct(request: Request, db: Session) -> None:
    """Non-dependency version for middleware use."""
    cookie_token, header_token = _extract_csrf_tokens(request)

    try:
        payload = get_jwt_payload(request, db)
        session = session_crud.get_session(db, payload.get("session_id"))

        if not session:
            raise HTTPException(status_code=403, detail="Invalid session")

        if session.csrf_token != cookie_token:
            raise HTTPException(status_code=403, detail="CSRF mismatch")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=403, detail="CSRF verification failed")


def verify_csrf(request: Request, db: Session = Depends(get_db)):
    """Dependency version for route handlers."""
    verify_csrf_tokens_direct(request, db)


def get_current_user(payload: dict = Depends(get_jwt_payload)):
    return payload
