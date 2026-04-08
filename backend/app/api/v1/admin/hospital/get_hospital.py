# app/api/v1/admin/hospital/get_hospital.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.deps import get_db
from app.core.rbac import require_role, Role
from app.deps_auth import require_role
from app.db.models import Hospital
from app.core.crypto import aesgcm_decrypt_str
import json

router = APIRouter()


def safe_decrypt(value):
    """Decrypts an AES-GCM encrypted field safely."""
    if not value:
        return None
    try:
        return aesgcm_decrypt_str(value)
    except Exception:
        return None


@router.get("/hospitals/{hospital_id}", summary="Get hospital details")
def get_hospital(
    hospital_id: str,
    db = Depends(get_db),
    payload = Depends(require_role([Role.ADMIN]))
):
    # Fetch Hospital
    h = db.get(Hospital, hospital_id)
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # -------------------------------
    # DECRYPT ADDRESS (JSON)
    # -------------------------------
    address = None
    decrypted_address = safe_decrypt(h.address_encrypted)

    if decrypted_address:
        try:
            address = json.loads(decrypted_address)
        except:
            address = None

    # -------------------------------
    # CLEAN RESPONSE (NO PASSWORDS)
    # -------------------------------
    return {
        "id": h.id,
        "name": h.hospital_name,

        "license_number": h.license_number,

       "owner_name": " ".join(
            filter(None, [
                h.owner_first_name,
                h.owner_middle_name,
                h.owner_last_name
            ])
        ),

        "owner_aadhaar": safe_decrypt(h.owner_aadhaar_encrypted),
        "phone": safe_decrypt(h.phone_encrypted),
        "email": safe_decrypt(h.email_encrypted),

        "address": address,

        "is_active": h.is_active,
        "created_at": h.created_at,
        "approved_at": h.approved_at,
        "approved_by": h.approved_by,
    }