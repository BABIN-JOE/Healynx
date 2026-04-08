"""
Medical CRUD module

Structured into:
- access (patient access control)
- history (approved records)
- pending (approval workflow)
"""

from .access import *

from .history import *
from .pending import *
