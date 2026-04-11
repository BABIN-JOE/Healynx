# Healynx Backend - Comprehensive Test Routes

This document outlines all critical API endpoints to test after CSRF refactoring.

## 1. Authentication & CSRF Flow ✓

### 1.1 Master Login (No CSRF needed - exempt)
```
POST /api/v1/auth/master/login
Content-Type: application/json

{
  "username": "master_user",
  "password": "password123"
}

Expected: 200 OK + CSRF token in response headers and cookies
```

### 1.2 Get Auth Status
```
GET /api/v1/auth/me
(With valid session cookie)

Expected: 200 OK + CSRF token refreshed
```

### 1.3 Logout (No CSRF needed - exempt, but should work)
```
POST /api/v1/auth/logout
(With valid session cookie)

Expected: 200 OK
```

### 1.4 Token Refresh (CSRF required for POST)
```
POST /api/v1/auth/refresh
Headers:
  - X-CSRF-Token: <token_from_login>
(With refresh token cookie)

Expected: 200 OK + new tokens
```

## 2. Master Admin Operations (CSRF required)

### 2.1 Create Admin
```
POST /api/v1/master/admins/create
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "username": "admin_user",
  "password": "secure123",
  "email": "admin@test.com",
  "phone": "9876543210",
  "aadhaar": "123456789012",
  "gender": "male",
  "dob": "1990-01-01",
  "address": {...}
}

Expected: 201 Created
```

### 2.2 Update Admin (CSRF required)
```
PUT /api/v1/master/admins/{admin_id}
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{...update data}

Expected: 200 OK
```

### 2.3 Block Admin (CSRF required)
```
POST /api/v1/master/admins/{admin_id}/block
Headers:
  - X-CSRF-Token: <csrf_token>

Expected: 200 OK
```

### 2.4 Unblock Admin (CSRF required)
```
POST /api/v1/master/admins/{admin_id}/unblock
Headers:
  - X-CSRF-Token: <csrf_token>

Expected: 200 OK
```

### 2.5 Delete Admin (CSRF required)
```
DELETE /api/v1/master/admins/{admin_id}
Headers:
  - X-CSRF-Token: <csrf_token>

Expected: 200 OK (soft delete)
```

### 2.6 List Admins (No CSRF for GET)
```
GET /api/v1/master/admins/list

Expected: 200 OK + list of admins
```

## 3. Doctor Operations (CSRF required)

### 3.1 Join Hospital (CSRF required - POST)
```
POST /api/v1/doctor/request-join/{hospital_license}
Headers:
  - X-CSRF-Token: <csrf_token>
(Doctor must be logged in)

Expected: 201 Created
```

### 3.2 Leave Hospital (CSRF required - POST) **[From logs: was failing with 500]**
```
POST /api/v1/doctor/leave-hospital
Headers:
  - X-CSRF-Token: <csrf_token>
(Doctor must be logged in)

Expected: 200 OK
```

### 3.3 Update Contact (CSRF required - PUT)
```
PUT /api/v1/doctor/me/contact
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{
  "phone": "9123456789",
  "email": "doctor@test.com",
  "address": "123 Street"
}

Expected: 200 OK
```

### 3.4 Change Password (CSRF required - POST)
```
POST /api/v1/doctor/change-password
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{
  "old_password": "old123",
  "new_password": "new456"
}

Expected: 200 OK
```

## 4. Hospital Operations (CSRF required)

### 4.1 Approve Doctor Join (CSRF required - POST)
```
POST /api/v1/hospital/doctor-join-requests/{req_id}/approve
Headers:
  - X-CSRF-Token: <csrf_token>
(Hospital must be logged in)

Expected: 200 OK
```

### 4.2 Decline Doctor Join (CSRF required - POST)
```
POST /api/v1/hospital/doctor-join-requests/{req_id}/reject
Headers:
  - X-CSRF-Token: <csrf_token>

Expected: 200 OK
```

### 4.3 Change Password (CSRF required)
```
POST /api/v1/hospital/change-password
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{
  "old_password": "old123",
  "new_password": "new456"
}

Expected: 200 OK
```

## 5. Medical Entries (CSRF required - POST/PUT/DELETE)

### 5.1 Create Medical Entry (CSRF required)
```
POST /api/v1/medical/entries
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{
  "entry_type": "visit",
  "patient_id": "...",
  "data": {...}
}

Expected: 201 Created
```

### 5.2 Update Medical Entry (CSRF required)
```
PUT /api/v1/medical/entries/{entry_id}
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{...}

Expected: 200 OK
```

### 5.3 Delete Medical Entry (CSRF required)
```
DELETE /api/v1/medical/entries/{entry_id}
Headers:
  - X-CSRF-Token: <csrf_token>

Expected: 200 OK
```

## 6. Admin Operations (CSRF required)

### 6.1 Create Patient (CSRF required)
```
POST /api/v1/admin/patient/create
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{
  "first_name": "Patient",
  "last_name": "User",
  "aadhaar": "123456789012",
  "dob": "1980-01-01",
  "gender": "male",
  "phone": "9876543210"
}

Expected: 201 Created
```

### 6.2 Update Patient (CSRF required)
```
PUT /api/v1/admin/patient/{patient_id}
Headers:
  - X-CSRF-Token: <csrf_token>
Content-Type: application/json

{...}

Expected: 200 OK
```

### 6.3 Delete Patient (CSRF required)
```
DELETE /api/v1/admin/patient/{patient_id}
Headers:
  - X-CSRF-Token: <csrf_token>

Expected: 200 OK
```

## 7. Critical Error Scenarios

### 7.1 POST without CSRF token
```
POST /api/v1/doctor/leave-hospital
(No X-CSRF-Token header, but has auth cookie)

Expected: 403 Forbidden - "CSRF missing"
```

### 7.2 POST with mismatched CSRF tokens
```
POST /api/v1/doctor/leave-hospital
Headers:
  - X-CSRF-Token: wrong_token
(Cookie has different token)

Expected: 403 Forbidden - "CSRF invalid"
```

### 7.3 Expired CSRF token
```
POST /api/v1/doctor/leave-hospital
Headers:
  - X-CSRF-Token: <expired_token>

Expected: 403 Forbidden - "CSRF mismatch"
```

### 7.4 Logout endpoint (CSRF exempt, should not error)
```
POST /api/v1/auth/logout
(With valid session, no CSRF token)

Expected: 200 OK
```

## Testing Checklist

- [ ] All GET requests work (no CSRF needed)
- [ ] All exempted POST requests work (login, logout, refresh, register)
- [ ] All authenticated POST/PUT/DELETE requests require CSRF token
- [ ] CSRF tokens are set in cookies after login
- [ ] CSRF tokens are sent in X-CSRF-Token header
- [ ] CSRF mismatch returns 403
- [ ] CSRF missing returns 403
- [ ] No 500 Internal Server Errors from CSRF middleware
- [ ] Medical entries can be created/updated/deleted
- [ ] Doctor can leave hospital
- [ ] Hospital can approve/decline doctor join
- [ ] All admin CRUD operations work
- [ ] Session hijacking protection works (user-agent check)
- [ ] Rate limiting works properly

## Expected Results After Fix

✓ No more "CSRF missing" 403 errors on legitimate requests
✓ No more 500 Internal Server Errors in CSRF middleware  
✓ All POST/PUT/DELETE state-changing operations work correctly
✓ CSRF tokens properly set and validated
✓ Frontend can successfully make authenticated requests
