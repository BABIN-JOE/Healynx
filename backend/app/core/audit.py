from app.core.time import utcnow
# app/core/audit.py
from app.db import crud
from sqlalchemy.orm import Session
from datetime import datetime

def log_action(session: Session, *, action_type: str, user_role: str, user_id=None, hospital_id=None, doctor_id=None, target_entity=None, target_entity_id=None, ip=None, user_agent=None, changed_fields=None, extra=None):
    payload = {
        "action_type": action_type,
        "user_role": user_role,
        "user_id": user_id,
        "hospital_id": hospital_id,
        "doctor_id": doctor_id,
        "target_entity": target_entity,
        "target_entity_id": target_entity_id,
        "timestamp": utcnow(),
        "ip_address": ip,
        "user_agent": user_agent,
        "changed_fields": changed_fields or {},
        "extra": extra or {}
    }
    return crud.create_audit_log(session, **payload)
