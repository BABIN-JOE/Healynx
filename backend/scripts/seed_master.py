import os, sys
# add the backend root path so "app" package works
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import engine
from app.db import crud
from app.db.models import Master
from app.core import crypto, security
from sqlmodel import Session, select

def seed():
    with Session(engine) as s:
        exist = s.exec(Master.select()).first() if hasattr(Master, "select") else None

        if exist:
            print("Master admin already exists.")
            return

        username = "master_123"
        password = "Master@123"

        aadhaar = "111122223333"  # dummy only
        aadhaar_enc = crypto.aesgcm_encrypt_str(aadhaar)
        phone_enc = crypto.aesgcm_encrypt_str("0000000000")
        email_enc = crypto.aesgcm_encrypt_str("master@example.com")
        address_enc = crypto.aesgcm_encrypt_str("Admin HQ")

        pwd_hash = security.hash_password(password)

        admin = crud.create_master(
            s,
            name="Master",
            gender="Other",
            dob="1990-01-01",
            aadhaar_encrypted=aadhaar_enc,
            phone_encrypted=phone_enc,
            email_encrypted=email_enc,
            address_encrypted=address_enc,
            username=username,
            password_hash=pwd_hash,
        )
        print("Master created:", admin.id)

if __name__ == "__main__":
    seed()
