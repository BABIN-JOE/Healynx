"""
Root CRUD exposure layer
"""

# Core modules
from .master import *
from .admin import *
from .hospital import *
from .doctor import *
from .doctor_request import *
from .doctor_hospital import *
from .patient import *
from .attachment import *
from .session import *
from .audit import *
from .utils import *
from .auth import *
from .dashboard import *
from .patient_update_request import *


# Structured medical module
from .medical import *

# Explicit patient exports (optional but clean)
from .patient import (
    get_patient,
    get_patient_by_id,
    get_patient_by_aadhaar_hash,
    create_patient,
    update_patient,
)

from .medical.pending.approval_engine import (
    approve_medical_entry_pending,
    decline_medical_entry_pending,
)
