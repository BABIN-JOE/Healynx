from datetime import datetime, timezone, timedelta


# =========================================================
# CONFIG — CENTRALIZED TIME RULES
# =========================================================

REQUEST_EXPIRY_MINUTES = 15        # Hospital must approve within 15 mins
SESSION_EXPIRY_MINUTES = 30        # Doctor can view records for 30 mins
ENTRY_EXPIRY_HOURS = 24            # Entry valid for 24 hours
HISTORY_EXPIRY_HOURS = 72          # History visible for 72 hours


# =========================================================
# CURRENT TIME (UTC ONLY — SINGLE SOURCE OF TRUTH)
# =========================================================

def utcnow() -> datetime:
    """
    Returns current UTC time (timezone-aware).
    MUST be used everywhere instead of datetime.now()/utcnow()
    """
    return datetime.now(timezone.utc)


# =========================================================
# ENSURE TIMEZONE SAFETY
# =========================================================

def ensure_utc(dt: datetime | None) -> datetime | None:
    """
    Converts naive datetime → UTC-aware datetime.
    Leaves aware datetime unchanged.
    """
    if dt is None:
        return None

    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)

    return dt


# =========================================================
# EXPIRY HELPERS (CORE LOGIC)
# =========================================================

def is_expired(dt: datetime | None) -> bool:
    """
    Returns True if given datetime is expired.
    """
    if not dt:
        return False

    dt = ensure_utc(dt)
    return utcnow() > dt


def seconds_remaining(dt: datetime | None) -> int:
    """
    Returns remaining time in seconds (never negative).
    """
    if not dt:
        return 0

    dt = ensure_utc(dt)
    return max(int((dt - utcnow()).total_seconds()), 0)


# =========================================================
# SAFE COMPARISON
# =========================================================

def is_before(a: datetime | None, b: datetime | None) -> bool:
    if not a or not b:
        return False

    a = ensure_utc(a)
    b = ensure_utc(b)

    return a < b


# =========================================================
# ISO FORMAT (API SAFE)
# =========================================================

def to_iso(dt: datetime | None) -> str | None:
    if not dt:
        return None

    dt = ensure_utc(dt)
    return dt.isoformat()


# =========================================================
# EXPIRY TIME GENERATORS (USE THESE — NEVER MANUAL timedelta)
# =========================================================

def request_expiry_time() -> datetime:
    """
    15 min window for hospital approval
    """
    return utcnow() + timedelta(minutes=REQUEST_EXPIRY_MINUTES)


def session_expiry_time() -> datetime:
    """
    30 min viewing access after approval
    """
    return utcnow() + timedelta(minutes=SESSION_EXPIRY_MINUTES)


def entry_expiry_time() -> datetime:
    """
    24 hour validity for entries
    """
    return utcnow() + timedelta(hours=ENTRY_EXPIRY_HOURS)


def history_expiry_time() -> datetime:
    """
    72 hour visibility for doctor history
    """
    return utcnow() + timedelta(hours=HISTORY_EXPIRY_HOURS)


# =========================================================
# DEBUG / LOGGING HELPERS (OPTIONAL BUT USEFUL)
# =========================================================

def debug_time(label: str, dt: datetime | None):
    dt = ensure_utc(dt)
    return f"[TIME DEBUG] {label}: {dt} | now={utcnow()}"
