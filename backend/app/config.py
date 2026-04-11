import os

from dotenv import load_dotenv

load_dotenv()


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    return int(value)


def _env_list(name: str) -> list[str]:
    value = os.getenv(name, "")
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    ENVIRONMENT: str = os.getenv("ENV", "development").strip().lower()
    IS_PRODUCTION: bool = ENVIRONMENT == "production"

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://healynx:healynx@localhost:5432/healynx_db",
    )

    JWT_PRIVATE_KEY: str = os.getenv("JWT_RS256_PRIVATE_KEY", "")
    JWT_PUBLIC_KEY: str = os.getenv("JWT_RS256_PUBLIC_KEY", "")
    JWT_ALGORITHM: str = "RS256"
    JWT_ISSUER: str = os.getenv("JWT_ISSUER", "healynx")

    APP_ENC_KEY: str = os.getenv("APP_ENC_KEY", "")
    AADHAAR_PEPPER: str = os.getenv("AADHAAR_PEPPER", "change_me_pepper")

    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minio")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minio123")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "healynx-attachments")
    MINIO_SECURE: bool = _env_bool("MINIO_SECURE", False)

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    DOCTOR_SESSION_MINUTES: int = _env_int("DOCTOR_SESSION_MINUTES", 15)
    ACCESS_TOKEN_MINUTES: int = _env_int("ACCESS_TOKEN_MINUTES", 15)
    REFRESH_TOKEN_DAYS: int = _env_int("REFRESH_TOKEN_DAYS", 7)
    MAX_AI_QUESTION_LENGTH: int = _env_int("MAX_AI_QUESTION_LENGTH", 500)

    COOKIE_SECURE: bool = _env_bool("COOKIE_SECURE", IS_PRODUCTION)
    COOKIE_SAMESITE: str = os.getenv(
        "COOKIE_SAMESITE",
        "none" if COOKIE_SECURE else "lax",
    ).strip().lower()

    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "").strip()
    ALLOWED_ORIGINS: list[str] = _env_list("ALLOWED_ORIGINS")
    ENABLE_DOCS: bool = _env_bool("ENABLE_DOCS", not IS_PRODUCTION)

    def __init__(self) -> None:
        if not self.ALLOWED_ORIGINS:
            defaults = [
                "https://healynx-med.vercel.app",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
            if self.FRONTEND_URL:
                defaults.insert(0, self.FRONTEND_URL)
            self.ALLOWED_ORIGINS = list(dict.fromkeys(defaults))

        if self.COOKIE_SAMESITE not in {"lax", "strict", "none"}:
            self.COOKIE_SAMESITE = "none" if self.COOKIE_SECURE else "lax"

        if self.COOKIE_SAMESITE == "none" and not self.COOKIE_SECURE:
            self.COOKIE_SAMESITE = "lax"

    def validate_runtime(self) -> None:
        missing = [
            name
            for name, value in (
                ("APP_ENC_KEY", self.APP_ENC_KEY),
                ("JWT_RS256_PRIVATE_KEY", self.JWT_PRIVATE_KEY),
                ("JWT_RS256_PUBLIC_KEY", self.JWT_PUBLIC_KEY),
            )
            if not value
        ]

        if missing:
            raise RuntimeError(
                "Missing required security configuration: " + ", ".join(missing)
            )

        if self.AADHAAR_PEPPER == "change_me_pepper":
            raise RuntimeError("AADHAAR_PEPPER must be set to a strong secret value")


settings = Settings()
