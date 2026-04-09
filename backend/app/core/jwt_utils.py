# app/core/jwt_utils.py

import jwt
from datetime import timedelta, datetime
from uuid import uuid4, UUID
from typing import Any, Dict

from app.config import settings
from app.core.time import utcnow, ensure_utc

ALGORITHM = settings.JWT_ALGORITHM


# ---------------------------------------------------------
# 🔧 SERIALIZE PAYLOAD FOR JWT
# ---------------------------------------------------------
def _serialize_value(value: Any) -> Any:
    """
    Convert non-JSON-serializable objects into serializable formats.
    """
    if isinstance(value, UUID):
        return str(value)

    if isinstance(value, datetime):
        return int(ensure_utc(value).timestamp())

    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}

    if isinstance(value, list):
        return [_serialize_value(v) for v in value]

    return value


def _serialize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure the JWT payload is fully JSON serializable.
    """
    return {k: _serialize_value(v) for k, v in payload.items() if v is not None}


# ---------------------------------------------------------
# 🔐 CREATE JWT
# ---------------------------------------------------------
def create_jwt(payload: dict, minutes: int = 30) -> str:
    """
    Create a signed JWT token with proper serialization.
    """
    now = utcnow()

    p = _serialize_payload(payload.copy())

    p.update({
        "exp": int((ensure_utc(now) + timedelta(minutes=minutes)).timestamp()),
        "iat": int(ensure_utc(now).timestamp()),
        "jti": str(uuid4()),
        "iss": "healynx",
    })

    return jwt.encode(p, settings.JWT_PRIVATE_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------
# 🔓 DECODE JWT
# ---------------------------------------------------------
def decode_jwt(token: str) -> dict:
    """
    Decode and validate a JWT token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY,
            algorithms=[ALGORITHM],
            issuer="healynx",
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise Exception("Token expired")

    except jwt.InvalidTokenError as e:
        raise Exception(f"Invalid token: {str(e)}")