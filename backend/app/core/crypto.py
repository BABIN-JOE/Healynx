# app/core/crypto.py

import os
import hashlib
import base64
import json
from typing import Optional, Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from argon2 import PasswordHasher
from app.config import settings
import re

# ---------------------------
# AES-GCM Encryption
# ---------------------------

def _load_app_enc_key() -> bytes:
    if not settings.APP_ENC_KEY:
        raise RuntimeError("APP_ENC_KEY environment variable not set (base64 32 bytes).")

    try:
        key = base64.b64decode(settings.APP_ENC_KEY, validate=True)
    except Exception as exc:
        raise RuntimeError("APP_ENC_KEY must be valid base64.") from exc

    if len(key) != 32:
        raise RuntimeError("APP_ENC_KEY must decode to exactly 32 bytes.")

    return key


APP_ENC_KEY_BYTES = _load_app_enc_key()


def aesgcm_encrypt_str(plaintext: str) -> bytes:
    aes = AESGCM(APP_ENC_KEY_BYTES)
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce + ct


def aesgcm_decrypt_str(blob: bytes) -> str:
    aes = AESGCM(APP_ENC_KEY_BYTES)
    nonce = blob[:12]
    ct = blob[12:]
    return aes.decrypt(nonce, ct, None).decode("utf-8")

# ---------------------------
# Aadhaar Hashing
# ---------------------------

def normalize_aadhaar(aadhaar: str) -> str:
    return "".join(filter(str.isdigit, str(aadhaar).strip()))


def aadhaar_hash_hex(aadhaar: str) -> str:
    clean = normalize_aadhaar(aadhaar)
    pepper = settings.AADHAAR_PEPPER or ""
    return hashlib.sha256((clean + pepper).encode("utf-8")).hexdigest()


# ---------------------------
# Deterministic Normalizers / Helpers
# ---------------------------
def normalize_phone(phone: str) -> str:
    """Return digits-only phone normalized for comparison."""
    if phone is None:
        return ""
    return "".join(filter(str.isdigit, str(phone)))


def normalize_email(email: str) -> str:
    """Return normalized email for comparison (lowercase, trimmed)."""
    if email is None:
        return ""
    return str(email).strip().lower()


def deterministic_hash_str(value: str) -> str:
    """Generic deterministic SHA256 hex for normalized values (phone/email).
    Use if you later add hash columns to DB.
    """
    if value is None:
        return ""
    norm = str(value).strip().lower()
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()


# ---------------------------
# Password Hashing (Argon2id)
# ---------------------------

ph = PasswordHasher()  # secure defaults: Argon2id, 64MB RAM, 3 iterations


def hash_password(password: str) -> str:
    """Secure Argon2id hashing."""
    return ph.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify hash using Argon2id."""
    try:
        return ph.verify(hashed, plain)
    except Exception:
        return False


def decrypt(blob: Optional[bytes]) -> Optional[str]:
    """
    Safely decrypt AES-GCM encrypted field.
    Returns None if input is None or decryption fails.
    """
    if not blob:
        return None
    try:
        return aesgcm_decrypt_str(blob)
    except Exception:
        return None


def decrypt_json(blob: Optional[bytes]) -> Optional[Any]:
    """
    Decrypt and parse JSON field (like address).
    Returns dict/list if valid JSON, else None.
    """
    decrypted = decrypt(blob)
    if not decrypted:
        return None

    try:
        return json.loads(decrypted)
    except Exception:
        return None
