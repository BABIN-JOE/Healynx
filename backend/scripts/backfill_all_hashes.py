import os
import sys
import hashlib
from sqlmodel import Session

# ---------------------------------------------------
# FIX PYTHONPATH (IMPORTANT)
# ---------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from app.db.session import engine
from app.db.models import (
    Admin, Doctor, DoctorRequest,
    Hospital, HospitalRequest, Patient,HospitalDoctorMap
)
from app.core.crypto import aesgcm_decrypt_str


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def normalize_phone(phone: str) -> str:
    return "".join(filter(str.isdigit, phone))


def normalize_email(email: str) -> str:
    return email.lower().strip()


def backfill_hashes(model, name: str, db: Session):
    print(f"\n🔄 Backfilling {name}...")

    rows = db.query(model).all()
    updated = 0

    for row in rows:
        # ------------------------
        # PHONE HASH
        # ------------------------
        if hasattr(row, "phone_encrypted") and row.phone_encrypted:
            try:
                phone = aesgcm_decrypt_str(row.phone_encrypted)
                phone_norm = normalize_phone(phone)
                row.phone_hash = sha256_hex(phone_norm)
                updated += 1
            except Exception as e:
                print(f"⚠ Could not decrypt phone for {name} ID {row.id}: {e}")

        # ------------------------
        # EMAIL HASH
        # ------------------------
        if hasattr(row, "email_encrypted") and row.email_encrypted:
            try:
                email = aesgcm_decrypt_str(row.email_encrypted)
                email_norm = normalize_email(email)
                row.email_hash = sha256_hex(email_norm)
                updated += 1
            except Exception as e:
                print(f"⚠ Could not decrypt email for {name} ID {row.id}: {e}")

    db.commit()
    print(f"✅ Completed {name}: {updated} records updated.")


def main():
    print("🚀 Starting hash backfill for all user types...")

    with Session(engine) as db:
        backfill_hashes(Admin, "Admins", db)
        backfill_hashes(Doctor, "Doctors", db)
        backfill_hashes(DoctorRequest, "Doctor Requests", db)
        backfill_hashes(Hospital, "Hospitals", db)
        backfill_hashes(HospitalDoctorMap, "HospitalDoctorMap",db)
        backfill_hashes(HospitalRequest, "Hospital Requests", db)
        backfill_hashes(Patient, "Patients", db)

    print("\n🎉 All backfills completed successfully!\n")


if __name__ == "__main__":
    main()





