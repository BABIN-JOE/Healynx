# app/api/v1/attachments.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session

from app.deps import get_db
from app.deps_auth import require_role
from app.core.rbac import Role
from app.services.minio_service import presign_put, presign_get
from app.db import crud
from app.schemas import PresignRequest
from app.core.audit import log_action

router = APIRouter()

@router.post("/presign")
def presign(req: PresignRequest, payload=Depends(require_role([Role.DOCTOR])), db = Depends(get_db), request: Request = None):
    # doctor must be in hospital context (payload has hospital_id)
    pre = presign_put(req.filename, req.content_type, hospital_id=payload.get("hospital_id"), patient_id=req.patient_id)
    # return upload url and object key (object_name)
    log_action(db, action_type="doctor.request_presign", user_role="doctor", user_id=payload.get("doctor_id"), hospital_id=payload.get("hospital_id"), target_entity="attachments", extra={"object_name": pre["object_name"]}, ip=request.client.host if request else None)
    return pre

@router.post("/register")
def register_attachment(medical_entry_id: str = None, filename: str = None, mime_type: str = None, size_bytes: int = None, object_name: str = None, payload=Depends(require_role([Role.DOCTOR])), db = Depends(get_db), request: Request = None):
    if not object_name:
        raise HTTPException(400, "object_name required")
    att = crud.create_attachment(db,
        medical_entry_id=medical_entry_id,
        filename=filename,
        mime_type=mime_type,
        size_bytes=size_bytes,
        minio_key=object_name,
        uploaded_by=payload.get("doctor_id")
    )
    log_action(db, action_type="doctor.register_attachment", user_role="doctor", user_id=payload.get("doctor_id"), hospital_id=payload.get("hospital_id"), target_entity="attachments", target_entity_id=att.id, ip=request.client.host if request else None)
    return {"attachment_id": str(att.id)}
