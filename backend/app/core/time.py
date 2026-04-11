from datetime import date, datetime, timedelta, timezone


# =========================================================
# Config
# =========================================================

REQUEST_EXPIRY_MINUTES = 15
SESSION_EXPIRY_MINUTES = 30
ENTRY_EXPIRY_HOURS = 24
HISTORY_EXPIRY_HOURS = 72


# =========================================================
# Core
# =========================================================

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def today_utc_date() -> date:
    return utcnow().date()


def ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None

    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(timezone.utc)


def minutes_from_now(minutes: int) -> datetime:
    return utcnow() + timedelta(minutes=minutes)


def hours_from_now(hours: int) -> datetime:
    return utcnow() + timedelta(hours=hours)


def days_from_now(days: int) -> datetime:
    return utcnow() + timedelta(days=days)


def parse_date_string(value: str) -> date:
    return date.fromisoformat(value)


def calculate_age(dob: date) -> int:
    today = today_utc_date()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


# =========================================================
# Comparison
# =========================================================

def is_expired(dt: datetime | None) -> bool:
    if not dt:
        return False

    normalized = ensure_utc(dt)
    return normalized is not None and utcnow() > normalized


def seconds_remaining(dt: datetime | None) -> int:
    if not dt:
        return 0

    normalized = ensure_utc(dt)
    if normalized is None:
        return 0

    return max(int((normalized - utcnow()).total_seconds()), 0)


def is_before(a: datetime | None, b: datetime | None) -> bool:
    if not a or not b:
        return False

    return ensure_utc(a) < ensure_utc(b)


def to_iso(dt: datetime | None) -> str | None:
    if not dt:
        return None

    normalized = ensure_utc(dt)
    return normalized.isoformat() if normalized else None


# =========================================================
# Project Windows
# =========================================================

def request_expiry_time() -> datetime:
    return minutes_from_now(REQUEST_EXPIRY_MINUTES)


def session_expiry_time() -> datetime:
    return minutes_from_now(SESSION_EXPIRY_MINUTES)


def entry_expiry_time() -> datetime:
    return hours_from_now(ENTRY_EXPIRY_HOURS)


def history_expiry_time() -> datetime:
    return hours_from_now(HISTORY_EXPIRY_HOURS)


# =========================================================
# Debug
# =========================================================

def debug_time(label: str, dt: datetime | None) -> str:
    normalized = ensure_utc(dt)
    return f"[TIME DEBUG] {label}: {normalized} | now={utcnow()}"