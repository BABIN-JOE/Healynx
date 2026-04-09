# app/core/jwt_utils.py

import jwt
from datetime import timedelta, datetime
from uuid import uuid4, UUID
from typing import Any, Dict

from app.config import settings
from app.core.time import utcnow, ensure_utc

ALGORITHM = settings.JWT_ALGORITHM


# ---------------------------------------------------------
# SERIALIZATION HELPERS
# ---------------------------------------------------------
def _serialize(value: Any) -> Any:
    """Convert non-JSON-serializable values to serializable types."""
    if isinstance(value, UUID):
        return str(value)

    if isinstance(value, datetime):
        return int(ensure_utc(value).timestamp())

    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}

    if isinstance(value, list):
        return [_serialize(v) for v in value]

    return value


def _sanitize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure payload is JSON serializable."""
    return {k: _serialize(v) for k, v in payload.items() if v is not None}


# ---------------------------------------------------------
# CREATE JWT
# ---------------------------------------------------------
def create_jwt(payload: dict, minutes: int = 30) -> str:
    now = utcnow()

    p = _sanitize_payload(payload.copy())

    p.update({
        "exp": int((ensure_utc(now) + timedelta(minutes=minutes)).timestamp()),
        "iat": int(ensure_utc(now).timestamp()),
        "jti": str(uuid4()),
        "iss": "healynx",
    })

    return jwt.encode(p, settings.JWT_PRIVATE_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------
# DECODE JWT
# ---------------------------------------------------------
def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY,
            algorithms=[ALGORITHM],
            issuer="healynx",
        )
    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")
    except jwt.InvalidTokenError as e:
        raise Exception(f"Invalid token: {str(e)}")