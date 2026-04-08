# app/core/security.py

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import secrets
from fastapi import Request, HTTPException

ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2, hash_len=32)


# ---------------------------------------------------------
# PASSWORD
# ---------------------------------------------------------
def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(hash: str, password: str) -> bool:
    try:
        return ph.verify(hash, password)
    except VerifyMismatchError:
        return False


# ---------------------------------------------------------
# CSRF
# ---------------------------------------------------------
def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def validate_csrf(request: Request):
    csrf_cookie = request.cookies.get("csrf_token")
    csrf_header = request.headers.get("X-CSRF-Token")

    if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
        raise HTTPException(403, "CSRF validation failed")