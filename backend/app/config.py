# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://healynx:healynx@localhost:5432/healynx_db")
    JWT_PRIVATE_KEY: str = os.getenv("JWT_RS256_PRIVATE_KEY", "")
    JWT_PUBLIC_KEY: str = os.getenv("JWT_RS256_PUBLIC_KEY", "")
    APP_ENC_KEY: str = os.getenv("APP_ENC_KEY", "")  # base64 of 32 bytes
    AADHAAR_PEPPER: str = os.getenv("AADHAAR_PEPPER", "change_me_pepper")
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minio")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minio123")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "healynx-attachments")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    JWT_ALGORITHM: str = "RS256"
    DOCTOR_SESSION_MINUTES: int = int(os.getenv("DOCTOR_SESSION_MINUTES", "15"))

settings = Settings()
