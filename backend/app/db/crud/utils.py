from app.core.time import entry_expiry_time, history_expiry_time, utcnow


def calculate_pending_windows():
    now = utcnow()
    expires_at = entry_expiry_time()
    doctor_visible_until = history_expiry_time()
    return now, expires_at, doctor_visible_until
