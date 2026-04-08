# app/core/rbac.py

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.jwt_utils import decode_jwt

bearer_scheme = HTTPBearer(auto_error=False)


# cookie names (match auth.py)
COOKIE_MASTER = "session_master"
COOKIE_ADMIN = "session_admin"
COOKIE_HOSPITAL = "session_hospital"
COOKIE_DOCTOR = "session_doctor"


class Role:
    MASTER = "master"
    ADMIN = "admin"
    HOSPITAL = "hospital"
    DOCTOR = "doctor"


def get_token_payload(request: Request, bearer: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """
    1) Try to read token from role-specific cookies (priority order).
    2) If not found, fallback to Authorization header (useful for Postman / tests).
    """
    token = None

    # Priority cookies: master -> admin -> hospital -> doctor
    for cookie_name in (COOKIE_MASTER, COOKIE_ADMIN, COOKIE_HOSPITAL, COOKIE_DOCTOR):
        if cookie_name in request.cookies:
            token = request.cookies.get(cookie_name)
            if token:
                break

    # Fallback to Authorization header (if provided)
    if not token and bearer is not None:
        token = bearer.credentials

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_jwt(token)
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(roles: list):
    def dependency(payload=Depends(get_token_payload)):
        role = payload.get("role")
        if role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role permissions")
        return payload

    return dependency
