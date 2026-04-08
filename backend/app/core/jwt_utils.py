# app/core/jwt_utils.py

import jwt
from datetime import timedelta
from uuid import uuid4

from app.config import settings
from app.core.time import utcnow, ensure_utc

ALGORITHM = settings.JWT_ALGORITHM


# ---------------------------------------------------------
# CREATE JWT
# ---------------------------------------------------------
def create_jwt(payload: dict, minutes: int = 30) -> str:
    now = utcnow()

    p = payload.copy()

    p.update({
        "exp": ensure_utc(now + timedelta(minutes=minutes)),
        "iat": ensure_utc(now),
        "jti": str(uuid4()),
        "iss": "healynx",
    })

    return jwt.encode(p, settings.JWT_PRIVATE_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------
# DECODE JWT
# ---------------------------------------------------------
def decode_jwt(token: str) -> dict:
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