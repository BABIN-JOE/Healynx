from typing import Optional, Dict

def extract_user_id(payload: Dict) -> Optional[str]:
    """Extract the authenticated user's ID regardless of role."""
    return (
        payload.get("user_id")
        or payload.get("admin_id")
        or payload.get("master_id")
        or payload.get("doctor_id")
        or payload.get("hospital_id")
    )