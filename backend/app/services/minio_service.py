# app/services/minio_service.py
from minio import Minio
from datetime import timedelta
from app.config import settings
import uuid

client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False  # set True if MinIO has TLS
)

BUCKET = settings.MINIO_BUCKET

def ensure_bucket():
    if not client.bucket_exists(BUCKET):
        client.make_bucket(BUCKET)

def generate_object_key(hospital_id: str = None, patient_id: str = None, filename: str = None):
    base = []
    if hospital_id:
        base.append(str(hospital_id))
    if patient_id:
        base.append(str(patient_id))
    base.append(str(uuid.uuid4()))
    if filename:
        base.append(filename)
    return "/".join(base)

def presign_put(filename: str, content_type: str, hospital_id: str = None, patient_id: str = None, expires_seconds: int = 300):
    ensure_bucket()
    object_name = generate_object_key(hospital_id, patient_id, filename)
    url = client.presigned_put_object(BUCKET, object_name, expires=timedelta(seconds=expires_seconds))
    return {"upload_url": url, "object_name": object_name}

def presign_get(object_name: str, expires_seconds: int = 300):
    ensure_bucket()
    return client.presigned_get_object(BUCKET, object_name, expires=timedelta(seconds=expires_seconds))
