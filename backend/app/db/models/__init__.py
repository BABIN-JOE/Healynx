# ----------------------------------------------------
# Base
# ----------------------------------------------------
from .base import SQLModelBase

# ----------------------------------------------------
# Core / Authentication
# ----------------------------------------------------
from .master import Master
from .admin import Admin

# ----------------------------------------------------
# Hospital / Doctor
# ----------------------------------------------------
from .hospital import Hospital, HospitalRequest
from .doctor import Doctor, DoctorRequest
from .mapping import HospitalDoctorMap
from .session import Session

# ----------------------------------------------------
# Patient
# ----------------------------------------------------
from .patient import Patient

# ----------------------------------------------------
# Attachments & Audit
# ----------------------------------------------------
from .attachment import Attachment
from .audit import AuditLog

# ----------------------------------------------------
# Medical – Access Control
# ----------------------------------------------------
from .medical.access import PatientAccessRequest

# ----------------------------------------------------
# Medical – Approved Records
# ----------------------------------------------------
from .medical.visit import Visit
from .medical.surgery import Surgery
from .medical.allergy import Allergy
from .medical.lab import LabResult
from .medical.lab_mapping import LabMapping
from .medical.immunization import Immunization
from .medical.long_term_condition import LongTermCondition

# ----------------------------------------------------
# Medical – Pending Records (Hospital Approval Required)
# ----------------------------------------------------
from .medical.pending.visit_pending import VisitPending
from .medical.pending.surgery_pending import SurgeryPending
from .medical.pending.allergy_pending import AllergyPending
from .medical.pending.lab_pending import LabPending
from .medical.pending.immunization_pending import ImmunizationPending
from .medical.pending.long_term_condition_pending import LongTermConditionPending


from .patient_update_request import PatientUpdateRequest
from .medical.access_session import PatientAccessSession
from .refresh_token import RefreshToken
