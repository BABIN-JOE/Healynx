from fastapi import APIRouter, Depends, HTTPException, Request

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.services.minio_service import is_allowed_object_key, presign_put, validate_attachment_type
from app.db import crud
from app.schemas import PresignRequest
from app.core.audit import log_action

router = APIRouter()

@router.post("/presign")
def presign(req: PresignRequest, payload=Depends(require_role([Role.DOCTOR])), db = Depends(get_db), request: Request = None):
    if not payload.get("hospital_id"):
        raise HTTPException(403, "Doctor must be mapped to a hospital")

    try:
        pre = presign_put(
            req.filename,
            req.content_type,
            hospital_id=payload.get("hospital_id"),
            patient_id=req.patient_id,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    log_action(db, action_type="doctor.request_presign", user_role="doctor", user_id=payload.get("doctor_id"), hospital_id=payload.get("hospital_id"), target_entity="attachments", extra={"object_name": pre["object_name"]}, ip=request.client.host if request else None)
    return pre

@router.post("/register")
def register_attachment(medical_entry_id: str = None, filename: str = None, mime_type: str = None, size_bytes: int = None, object_name: str = None, payload=Depends(require_role([Role.DOCTOR])), db = Depends(get_db), request: Request = None):
    if not object_name:
        raise HTTPException(400, "object_name required")
    if size_bytes is not None and size_bytes < 0:
        raise HTTPException(400, "size_bytes must be non-negative")

    if not is_allowed_object_key(
        object_name,
        hospital_id=payload.get("hospital_id"),
    ):
        raise HTTPException(400, "Invalid object_name")

    if mime_type:
        try:
            validate_attachment_type(mime_type)
        except ValueError as exc:
            raise HTTPException(400, str(exc)) from exc

    att = crud.create_attachment(db,
        parent_id=medical_entry_id,
        parent_type="medical_entry",
        filename=filename,
        mime_type=mime_type,
        size_bytes=size_bytes,
        minio_key=object_name,
        uploaded_by=payload.get("doctor_id")
    )
    log_action(db, action_type="doctor.register_attachment", user_role="doctor", user_id=payload.get("doctor_id"), hospital_id=payload.get("hospital_id"), target_entity="attachments", target_entity_id=att.id, ip=request.client.host if request else None)
    return {"attachment_id": str(att.id)}
