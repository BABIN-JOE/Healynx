from app.core.time import utcnow
from datetime import datetime, timedelta


def calculate_pending_windows():
    now = utcnow()
    expires_at = now + timedelta(hours=24)
    doctor_visible_until = now + timedelta(hours=72)
    return now, expires_at, doctor_visible_until


def reset_pending_workflow(obj):
    now, expires_at, _ = calculate_pending_windows()

    obj.status = "pending"
    obj.decline_reason = None
    obj.approved_by = None
    obj.approved_at = None
    obj.revision_count = (obj.revision_count or 0) + 1
    obj.expires_at = expires_at