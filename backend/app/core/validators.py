# app/core/validators.py

import re
from datetime import datetime


# ============================================================
# Aadhaar Validation (With Verhoeff Checksum)
# ============================================================

verhoeff_d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
]

verhoeff_p = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8]
]

def verhoeff_validate(num: str) -> bool:
    c = 0
    num = num[::-1]
    for i, item in enumerate(num):
        c = verhoeff_d[c][verhoeff_p[i % 8][int(item)]]
    return c == 0


def validate_aadhaar(aadhaar: str):
    aadhaar = "".join(filter(str.isdigit, aadhaar))
    
    if len(aadhaar) != 12:
        raise ValueError("Aadhaar must contain exactly 12 digits.")

    if not verhoeff_validate(aadhaar):
        raise ValueError("Invalid Aadhaar number (checksum failed).")


# ============================================================
# Phone Number Validation (10 digits)
# ============================================================

def validate_phone(phone: str):
    phone = "".join(filter(str.isdigit, phone))

    if len(phone) != 10:
        raise ValueError("Phone number must contain exactly 10 digits.")


# ============================================================
# Email Validation
# ============================================================

email_regex = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

def validate_email(email: str):
    if not email_regex.match(email):
        raise ValueError("Invalid email format.")


# ============================================================
# Name Validation
# ============================================================

def validate_name(name: str):
    if len(name.strip()) < 1:
        raise ValueError("Name must contain at least 2 characters.")

    if not all(c.isalpha() or c.isspace() for c in name):
        raise ValueError("Name must contain only letters and spaces.")


# ============================================================
# Gender Validation
# ============================================================

def validate_gender(gender: str):
    valid = {"male", "female", "other"}

    if gender.lower() not in valid:
        raise ValueError("Gender must be: male, female, or other.")


# ============================================================
# Date of Birth Validation (YYYY-MM-DD)
# ============================================================

def validate_dob(dob: str):
    try:
        datetime.strptime(dob, "%Y-%m-%d")
    except:
        raise ValueError("DOB must be in YYYY-MM-DD format.")


# ============================================================
# Address Validation
# ============================================================

def validate_address_object(address: dict):
    """
    Expected structure:
    {
        "house_details": str (required),
        "street": str (optional),
        "locality": str (required),
        "city": str (required),
        "district": str (required),
        "state": str (required),
        "pincode": str (required)
    }
    """

    required_fields = ["house_details", "locality", "city", "district", "state", "pincode"]

    # Must be a dict
    if not isinstance(address, dict):
        raise ValueError("Address must be a JSON object")

    # Required fields must exist
    for field in required_fields:
        if field not in address or not str(address[field]).strip():
            raise ValueError(f"'{field}' is required in address")

    # Validation rules
    if len(address["house_details"]) < 1:
        raise ValueError("house_details must have at least 3 characters")

    if not address["pincode"].isdigit() or len(address["pincode"]) != 6:
        raise ValueError("pincode must be exactly 6 digits")

    # Optional field checks
    if "street" in address and address["street"]:
        if len(address["street"]) < 3:
            raise ValueError("street must contain at least 3 characters")

# ============================================================
# Password Strength Validation
# ============================================================

def validate_password(password: str):
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")

    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")

    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter.")

    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one digit.")

    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("Password must contain at least one special character.")

    if " " in password:
        raise ValueError("Password cannot contain spaces.")


# ============================================================
# Doctor Registration Number Validation
# Valid formats:
#   TN12345
#   TN/2021/12345
#   AP2023123
# ============================================================

doctor_reg_regex = re.compile(
    r"^[A-Za-z]{2,3}(/20[0-9]{2})?/[0-9]{3,7}$|^[A-Za-z]{2,3}[0-9]{3,7}$"
)

def validate_doctor_registration(reg_no: str):
    if not doctor_reg_regex.match(reg_no):
        raise ValueError(
            "Invalid doctor registration number. Examples: TN12345, TN/2021/123456"
        )


# ============================================================
# Hospital License Validation
# Valid formats:
#   TNH1234
#   TN/2024/12345
#   ABC98765
# ============================================================

hospital_license_regex = re.compile(r"^[A-Za-z0-9/]{5,20}$")

def validate_hospital_license(license_no: str):
    if not hospital_license_regex.match(license_no):
        raise ValueError(
            "Invalid hospital license number (5–20 chars, alphanumeric, optional '/')."
        )
