from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException, Request


LOGIN_WINDOW_SECONDS = 60
LOGIN_MAX_FAILURES = 5
LOGIN_BLOCK_SECONDS = 300

_attempt_store: dict[str, deque[float]] = defaultdict(deque)
_blocked_until: dict[str, float] = {}


def _client_identity(request: Request, identifier: str = "") -> str:
    client_ip = request.client.host if request.client else "unknown"
    normalized_identifier = identifier.strip().lower()
    return f"{client_ip}:{normalized_identifier}"


def _trim_attempts(key: str, now: float) -> deque[float]:
    attempts = _attempt_store[key]
    while attempts and attempts[0] <= now - LOGIN_WINDOW_SECONDS:
        attempts.popleft()
    return attempts


def verify_rate_limit_login(request: Request, identifier: str = "") -> None:
    key = _client_identity(request, identifier)
    now = monotonic()
    blocked_until = _blocked_until.get(key)

    if blocked_until and blocked_until > now:
        retry_after = max(int(blocked_until - now), 1)
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed login attempts. Retry after {retry_after} seconds.",
        )

    if blocked_until and blocked_until <= now:
        _blocked_until.pop(key, None)
        _attempt_store.pop(key, None)

    _trim_attempts(key, now)


def record_login_failure(request: Request, identifier: str = "") -> None:
    key = _client_identity(request, identifier)
    now = monotonic()
    attempts = _trim_attempts(key, now)
    attempts.append(now)

    if len(attempts) >= LOGIN_MAX_FAILURES:
        _blocked_until[key] = now + LOGIN_BLOCK_SECONDS


def clear_login_failures(request: Request, identifier: str = "") -> None:
    key = _client_identity(request, identifier)
    _attempt_store.pop(key, None)
    _blocked_until.pop(key, None)
