import re
import uuid
from datetime import timedelta

from minio import Minio

from app.config import settings

client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE,
)

BUCKET = settings.MINIO_BUCKET
ALLOWED_ATTACHMENT_TYPES = {
    "application/dicom",
    "application/dicom+json",
    "application/pdf",
    "image/jpeg",
    "image/png",
}
_SAFE_FILENAME_CHARS = re.compile(r"[^A-Za-z0-9._-]+")


def ensure_bucket():
    if not client.bucket_exists(BUCKET):
        client.make_bucket(BUCKET)


def validate_attachment_type(content_type: str) -> None:
    normalized = (content_type or "").strip().lower()
    if normalized not in ALLOWED_ATTACHMENT_TYPES:
        raise ValueError("Unsupported attachment type")


def sanitize_filename(filename: str) -> str:
    cleaned = (filename or "").split("/")[-1].split("\\")[-1].strip()
    cleaned = _SAFE_FILENAME_CHARS.sub("_", cleaned).strip("._")

    if not cleaned:
        raise ValueError("Invalid filename")

    if len(cleaned) > 120:
        raise ValueError("Filename is too long")

    return cleaned


def generate_object_key(
    hospital_id: str = None,
    patient_id: str = None,
    filename: str = None,
):
    base = []
    if hospital_id:
        base.append(str(hospital_id))
    if patient_id:
        base.append(str(patient_id))
    base.append(str(uuid.uuid4()))
    if filename:
        base.append(sanitize_filename(filename))
    return "/".join(base)


def is_allowed_object_key(object_name: str, hospital_id: str = None, patient_id: str = None) -> bool:
    if not object_name or ".." in object_name:
        return False

    expected_parts = [part for part in (str(hospital_id or ""), str(patient_id or "")) if part]
    object_parts = object_name.split("/")

    if len(object_parts) < len(expected_parts) + 2:
        return False

    return object_parts[: len(expected_parts)] == expected_parts


def presign_put(
    filename: str,
    content_type: str,
    hospital_id: str = None,
    patient_id: str = None,
    expires_seconds: int = 300,
):
    validate_attachment_type(content_type)
    ensure_bucket()
    object_name = generate_object_key(hospital_id, patient_id, filename)
    url = client.presigned_put_object(
        BUCKET,
        object_name,
        expires=timedelta(seconds=expires_seconds),
    )
    return {"upload_url": url, "object_name": object_name}


def presign_get(object_name: str, expires_seconds: int = 300):
    ensure_bucket()
    return client.presigned_get_object(
        BUCKET,
        object_name,
        expires=timedelta(seconds=expires_seconds),
    )
