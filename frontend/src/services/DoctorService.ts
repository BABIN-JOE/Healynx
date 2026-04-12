//src/services/DoctorService.ts

import apiClient from "../api/apiClient";

/* =========================
   TYPES
========================= */

export type MedicalEntryType =
  | "visit"
  | "surgery"
  | "allergy"
  | "lab"
  | "immunization"
  | "long_term_condition";

export type EntryStatus =
  | "pending"
  | "approved"
  | "declined"
  | "expired";

/* =========================
   ACCESS TYPES
========================= */

export interface ApprovedPatientAccess {
  patient_id: string;
  patient_name: string;
  view_expires_in: number;
  entry_expires_in: number;
  remaining_seconds?: number;
}

export interface EntryAccessPatient {
  patient_id: string;
  patient_name: string;
  entry_access_expires_at: string;
  remaining_seconds?: number;
}

/* =========================
   BASE PAYLOAD
========================= */

export interface BasePendingPayload {
  type: MedicalEntryType;
  patient_id: string;
}

/* =========================
   VISIT
========================= */

export interface VisitPayload extends BasePendingPayload {
  type: "visit";

  parent_visit_id?: string;

  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  followup_condition?: string;

  medication_name?: string;
  medication_start_date?: string;
  medication_end_date?: string;
}

/* =========================
   SURGERY
========================= */

export interface SurgeryPayload extends BasePendingPayload {
  type: "surgery";

  parent_surgery_id?: string;

  surgery_name?: string;
  body_part?: string;
  reason?: string;
  description?: string;
  notes?: string;

  surgery_date?: string;
  admit_date?: string;
  discharge_date?: string;

  followup_condition?: string;

  medication_name?: string;
  medication_start_date?: string;
  medication_end_date?: string;
}

/* =========================
   ALLERGY
========================= */

export interface AllergyPayload extends BasePendingPayload {
  type: "allergy";

  parent_allergy_id?: string;

  allergy_type: string;
  body_location?: string;
  severity?: string;

  first_noted_date?: string;

  diagnosis?: string;
  notes?: string;
  followup_condition?: string;

  medication_name?: string;
  medication_start_date?: string;
  medication_end_date?: string;
}

/* =========================
   LAB
========================= */

export interface LabPayload extends BasePendingPayload {
  type: "lab";

  test_name: string;
  body_part?: string;
  reason?: string;

  result_text?: string;
  notes?: string;

  test_date?: string;
}

/* =========================
   IMMUNIZATION
========================= */

export interface ImmunizationPayload extends BasePendingPayload {
  type: "immunization";

  vaccine_name: string;
  dosage?: string;
  reason?: string;

  vaccination_date: string;
  notes?: string;
}

export interface FollowUp {
  id: string
  notes?: string
  created_at: string
}

/* =========================
   LONG TERM CONDITION
========================= */

export interface LongTermConditionPayload extends BasePendingPayload {
  type: "long_term_condition";

  parent_condition_id?: string;

  condition_name: string;
  first_noted_date?: string;

  current_condition?: string;
  diagnosis?: string;
  notes?: string;

  medication_name?: string;
  medication_start_date?: string;
  medication_end_date?: string;
}

/* =========================
   UNION
========================= */

export type CreatePendingEntryPayload =
  | VisitPayload
  | SurgeryPayload
  | AllergyPayload
  | LabPayload
  | ImmunizationPayload
  | LongTermConditionPayload;

/* =========================
   APPROVED ENTRY
========================= */

export interface ApprovedEntry {
  id: string;
  entry_type: MedicalEntryType;
  created_at: string;

  /* ================= VISIT ================= */

  visit_date?: string;
  chief_complaint?: string;
  diagnosis?: string;
  followup_condition?: string;

  /* ================= SURGERY ================= */

  body_part?: string;
  surgery_name?: string;
  reason?: string;
  description?: string;
  surgery_date?: string;
  admit_date?: string;
  discharge_date?: string;

  /* ================= ALLERGY ================= */

  allergy_type?: string;
  body_location?: string;
  severity?: string;

  /* ================= LAB ================= */

  test_name?: string;
  result_text?: string;
  test_date?: string;

  /* ================= IMMUNIZATION ================= */

  vaccine_name?: string;
  vaccination_date?: string;
  dosage?: string;


  /* ================= LONG TERM CONDITION ================= */

  condition_name?: string;
  first_noted_date?: string;
  current_condition?: string;

  /* ================= COMMON ================= */

  doctor_name?: string;
  hospital_name?: string;
  
  notes?: string;

  medication_name?: string;
  medication_start_date?: string;
  medication_end_date?: string;

  /* ================= FOLLOWUPS ================= */

  followups?: FollowUp[];
}

/* =========================
   DOCTOR ENTRY HISTORY
========================= */

export interface DoctorEntryHistoryItem {
  id: string;
  patient_id: string;
  type: MedicalEntryType;
  status: EntryStatus;
  created_at: string;
  expires_at?: string;
  reviewed_at?: string;
  decline_reason?: string;
  can_edit?: boolean;
  can_rerequest?: boolean;
}

/* =========================
   SERVICE
========================= */

export const DoctorService = {


  // =========================
  // ADMIN DOCTOR MANAGEMENT
  // =========================

  async getDoctor(id: string) {
    const { data } = await apiClient.get(`/api/v1/admin/doctors/${id}`);
    return { data };
  },

  async updateDoctor(id: string, payload: any) {
    const { data } = await apiClient.put(`/api/v1/admin/doctors/${id}`, payload);
    return { data };
  },

  /* =========================
     ACCESS REQUEST
  ========================= */

  async requestPatientAccess(aadhaar: string) {
    const { data } = await apiClient.post(
      "/api/v1/medical/access-request",
      { aadhaar }
    );
    return data;
  },

  /* =========================
     READ ACCESS
  ========================= */

  async getApprovedPatientAccess(): Promise<ApprovedPatientAccess[]> {
    const { data } = await apiClient.get(
      "/api/v1/medical/my-approved-patient-access"
    );
    return data;
  },

  /* =========================
     ENTRY ACCESS (24h)
  ========================= */

  async getEntryAccessPatients(): Promise<EntryAccessPatient[]> {
    const { data } = await apiClient.get(
      "/api/v1/medical/my-entry-access"
    );
    return data;
  },

  /* =========================
     PATIENT DATA
  ========================= */

  async getPatientDetails(patientId: string) {
    const { data } = await apiClient.get(
      `/api/v1/medical/patient/${patientId}`
    );
    return data;
  },

  async getApprovedEntries(
    patientId: string
  ): Promise<ApprovedEntry[]> {
    try {
      const { data } = await apiClient.get(
        `/api/v1/medical/patient/${patientId}/approved-entries`
      );
      return data;
    } catch (error: any) {

      if (error.response?.status === 403) {
        throw error;
      }
      throw error;
    }
  },

  /* =========================
     DOCTOR ENTRY HISTORY
  ========================= */

  async getDoctorEntryHistory(): Promise<DoctorEntryHistoryItem[]> {
    const { data } = await apiClient.get(
      "/api/v1/medical/entries/doctor-history"
    );
    return data;
  },

  /* =========================
     GET PENDING ENTRY DETAILS
  ========================= */

  async getPendingEntry(pendingId: string) {
    const { data } = await apiClient.get(
      `/api/v1/medical/entries/pending/${pendingId}`
    );
    return data;
  },

  /* =========================
     CREATE ENTRY
  ========================= */

  async createPendingMedicalEntry(
    payload: CreatePendingEntryPayload
  ) {
    const { data } = await apiClient.post(
      "/api/v1/medical/entries/pending",
      payload
    );
    return data;
  },

  /* =========================
     EDIT ENTRY
  ========================= */

  async editPendingEntry(
    pendingId: string,
    payload: Partial<CreatePendingEntryPayload>
  ) {
    const { data } = await apiClient.put(
      `/api/v1/medical/entries/pending/${pendingId}`,
      payload
    );
    return data;
  },

  /* =========================
     REREQUEST ENTRY
  ========================= */

  async reRequestEntry(pendingId: string) {
    const { data } = await apiClient.post(
      `/api/v1/medical/entries/pending/${pendingId}/rerequest`
    );
    return data;
  },

  /* =========================
     FOLLOWUP DROPDOWN DATA
  ========================= */

  async getPreviousVisits(patientId: string) {
    const { data } = await apiClient.get(
      `/api/v1/medical/patient/${patientId}/visits`
    );
    return data;
  },

  async getPreviousSurgeries(patientId: string) {
    const { data } = await apiClient.get(
      `/api/v1/medical/patient/${patientId}/surgeries`
    );
    return data;
  },

  async getPreviousAllergies(patientId: string) {
    const { data } = await apiClient.get(
      `/api/v1/medical/patient/${patientId}/allergies`
    );
    return data;
  },

  async getPreviousConditions(patientId: string) {
    const { data } = await apiClient.get(
      `/api/v1/medical/patient/${patientId}/conditions`
    );
    return data;
  },

  /* =========================
     PROFILE UPDATE
  ========================= */

  async requestProfileUpdate(
    patientId: string,
    changes: {
      blood_group?: string;
      phone?: string;
      emergency_contact?: string;
    }
  ) {
    const { data } = await apiClient.post(
      `/api/v1/medical/patient/${patientId}/update-request`,
      changes
    );
    return data;
  },

  /* =========================
     CHANGE PASSWORD
  ========================= */

  async changePassword(payload: { old_password: string; new_password: string }) {
    const { data } = await apiClient.post("/api/v1/doctor/change-password", payload);
    return data;
  },
};