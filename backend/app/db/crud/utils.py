from app.core.time import utcnow
from datetime import datetime, timedelta


def calculate_pending_windows():
    now = utcnow()
    expires_at = now + timedelta(hours=24)
    doctor_visible_until = now + timedelta(hours=72)
    return now, expires_at, doctor_visible_until
