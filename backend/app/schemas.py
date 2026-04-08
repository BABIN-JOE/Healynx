# app/schemas.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ---------------------------------------------------------
# UPDATED ADDRESS MODEL (NEW REQUIREMENT)
# ---------------------------------------------------------

class Address(BaseModel):
    house_details: str = Field(..., min_length=1)
    street: Optional[str] = None  # optional
    locality: str = Field(..., min_length=3)
    city: str = Field(..., min_length=3)
    district: str = Field(..., min_length=3)
    state: str = Field(..., min_length=3)
    pincode: str = Field(..., min_length=6, max_length=6)


# ---------------------------------------------------------
# AUTH SCHEMAS
# ---------------------------------------------------------

class LoginSchema(BaseModel):
    username: str
    password: str


class HospitalLoginSchema(BaseModel):
    license_number: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: Optional[datetime]


# ---------------------------------------------------------
# ADMIN / MASTER CREATE SCHEMAS
# middle_name optional
# everything else mandatory
# ---------------------------------------------------------

class AdminBase(BaseModel):
    first_name: str = Field(..., min_length=1)
    middle_name: Optional[str] = None
    last_name: str = Field(..., min_length=1)

    gender: str = Field(..., min_length=1)
    dob: str = Field(..., min_length=1)

    aadhaar: str = Field(..., min_length=12, max_length=12)

    phone: str = Field(..., min_length=10,max_length=10)
    email: EmailStr

    address: Address

    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class AdminCreate(AdminBase):
    pass


class MasterCreate(AdminBase):
    pass


# ---------------------------------------------------------
# HOSPITAL REQUEST
# ---------------------------------------------------------

class HospitalRequestCreate(BaseModel):
    hospital_name: str
    license_number: str

    owner_first_name: str
    owner_middle_name: Optional[str] = None
    owner_last_name: str

    owner_aadhaar: str

    phone: str
    email: EmailStr

    address: Address
    password: str


# ---------------------------------------------------------
# DOCTOR REQUEST
# ---------------------------------------------------------

class DoctorRequestCreate(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str

    dob: str
    gender: str
    specialization: str
    
    aadhaar: str
    license_number: str

    phone: str
    email: EmailStr

    address: Address
    password: str


# ---------------------------------------------------------
# PATIENT CREATE
# middle_name optional
# email optional
# ALL OTHER FIELDS REQUIRED
# ---------------------------------------------------------

class PatientCreate(BaseModel):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str

    gender: str
    dob: str

    father_name: str
    mother_name: str

    address: Dict[str, Any]

    phone: str
    emergency_contact: str
    email: Optional[EmailStr] = None

    aadhaar: str
    blood_group: str

# ---------------------------------------------------------
# DOCTOR – APPROVED PATIENT ACCESS (TEMPORARY VISIBILITY)
# ---------------------------------------------------------

class DoctorApprovedPatientAccessOut(BaseModel):
    request_id: str
    patient_id: str
    patient_name: str
    expires_at: datetime


# ---------------------------------------------------------
# MEDICAL ENTRY CREATE
# ---------------------------------------------------------

class MedicalEntryCreate(BaseModel):
    patient_id: str
    entry_type: str
    description: Optional[str] = None
    medications: Optional[List[Dict[str, Any]]] = []
    timestamp: Optional[datetime] = None


# ---------------------------------------------------------
# ATTACHMENT (FILE UPLOAD)
# ---------------------------------------------------------

class PresignRequest(BaseModel):
    filename: str
    content_type: str
    patient_id: Optional[str] = None
    medical_entry_id: Optional[str] = None
