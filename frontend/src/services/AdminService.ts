// src/services/AdminService.ts
import apiClient from "../api/apiClient";

/* ================================
   TYPES
================================ */

export type HospitalRequestSummary = {
  id: string;
  hospital_name: string;
  license_number: string;
  owner_name: string;
  owner_aadhaar?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: string;
  submitted_at?: string | null;
};

export type DoctorRequestSummary = {
  id: string;
  hospital_id?: string | null;
  hospital_name?: string | null;
  full_name: string;
  specialization?: string | null;
  license_number: string;
  aadhaar_last4?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: string;
  submitted_at?: string | null;
};

export type PatientCreatePayload = {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  gender: string;
  dob: string;
  blood_group: string;
  father_name?: string;
  mother_name?: string;
  address: {
    house_details: string;
    street?: string;
    locality?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  phone?: string | null;
  emergency_contact?: string | null;
  email?: string | null;
  aadhaar: string;
};

export type PatientUpdatePayload = {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  gender?: string;
  dob?: string;
  blood_group?: string;
  father_name?: string;
  mother_name?: string;
  address_obj?: {
    house_details?: string;
    street?: string;
    locality?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  phone?: string | null;
  emergency_contact?: string | null;
  email?: string | null;
};

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};

// backend base
const BASE = "/api/v1/admin";

/* ==========================================
   DASHBOARD RESPONSE TYPE
========================================== */
type DashboardStatsResponse = {
  pendingHospitals?: number;
  pending_hospitals?: number;

  pendingDoctors?: number;
  pending_doctors?: number;

  totalHospitals?: number;
  total_hospitals?: number;

  totalDoctors?: number;
  total_doctors?: number;
};

/* ================================
   SERVICE METHODS
================================ */

const AdminService = {
  /* -------------------------
     HOSPITAL REQUESTS
  ------------------------- */
  async getHospitalRequests(status?: string): Promise<HospitalRequestSummary[]> {
    const params = status ? { status } : {};
    const res = await apiClient.get<HospitalRequestSummary[]>(
      `${BASE}/hospital-requests`,
      { params }
    );
    return res.data;
  },

  async getHospitalRequestById(id: string) {
    const res = await apiClient.get(`${BASE}/hospital-requests/${id}`);
    return res.data;
  },

  async approveHospital(id: string) {
    const res = await apiClient.post(`${BASE}/hospital-requests/${id}/approve`);
    return res.data;
  },

  async rejectHospital(id: string) {
    const res = await apiClient.post(`${BASE}/hospital-requests/${id}/reject`);
    return res.data;
  },

  /* -------------------------
     HOSPITALS
  ------------------------- */
  async getHospitals(activeOnly?: boolean, page = 1, limit = 300): Promise<any[]> {
    const params: any = { page, limit };
    if (activeOnly !== undefined) params.active = activeOnly ? 1 : 0;
    const res = await apiClient.get(`${BASE}/hospitals`, { params });
    return res.data;
  },

  async getHospitalById(id: string) {
    const res = await apiClient.get(`${BASE}/hospitals/${id}`);
    return res.data;
  },

  async blockHospital(id: string) {
    const res = await apiClient.post(`${BASE}/hospitals/${id}/block`);
    return res.data;
  },

  async unblockHospital(id: string) {
    const res = await apiClient.post(`${BASE}/hospitals/${id}/unblock`);
    return res.data;
  },

  async deleteHospital(id: string) {
    const res = await apiClient.delete(`${BASE}/hospitals/${id}`);
    return res.data;
  },

  /* -------------------------
     DOCTOR REQUESTS
  ------------------------- */
  async getDoctorRequests(status?: string): Promise<DoctorRequestSummary[]> {
    const params = status ? { status } : {};
    const res = await apiClient.get<DoctorRequestSummary[]>(
      `${BASE}/doctor-requests`,
      { params }
    );
    return res.data;
  },

  async approveDoctor(id: string) {
    const res = await apiClient.post(`${BASE}/doctor-requests/${id}/approve`);
    return res.data;
  },

  async rejectDoctor(id: string) {
    const res = await apiClient.post(`${BASE}/doctor-requests/${id}/reject`);
    return res.data;
  },

  async getDoctorRequestById(id: string) {
    const res = await apiClient.get(`${BASE}/doctor-requests/${id}`);
    return res.data;
  },

  /* -------------------------
     DOCTORS (approved)
  ------------------------- */
  async getDoctors(activeOnly?: boolean, page = 1, limit = 200): Promise<any[]> {
    const params: any = { page, limit };
    if (activeOnly !== undefined) params.active = activeOnly ? 1 : 0;
    const res = await apiClient.get(`${BASE}/doctors`, { params });
    return res.data?.data ?? [];
  },

  async getDoctorById(id: string) {
    const res = await apiClient.get(`${BASE}/doctors/${id}`);
    return res.data;
  },

  async blockDoctor(id: string) {
    return apiClient.post(`${BASE}/doctors/${id}/block`);
  },

  async unblockDoctor(id: string) {
    return apiClient.post(`${BASE}/doctors/${id}/unblock`);
  },

  async deleteDoctor(id: string) {
    const res = await apiClient.delete(`${BASE}/doctors/${id}`);
    return res.data;
  },

  /* -------------------------
     PATIENTS
  ------------------------- */
  async createPatient(payload: PatientCreatePayload) {
    const res = await apiClient.post(`${BASE}/patients`, payload);
    return res.data;
  },

  async updatePatient(id: string, payload: PatientUpdatePayload) {
    const res = await apiClient.put(`${BASE}/patients/${id}`, payload);
    return res.data;
  },

  async getPatientById(id: string) {
    const res = await apiClient.get(`${BASE}/patients/${id}`);
    return res.data;
  },

  async getPatients(page = 1, limit = 100): Promise<PaginatedResponse<any>> {
    const res = await apiClient.get<PaginatedResponse<any>>(`${BASE}/patients`, {
      params: { page, limit },
    });
    return res.data;
  },

  async searchPatients(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }) {
    const res = await apiClient.get("/api/v1/admin/patients", {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        active: params?.active ?? true,
      },
    });

    return res.data.data;
  },

  async deletePatient(id: string) {
    const res = await apiClient.delete(`${BASE}/patients/${id}`);
    return res.data;
  },

  /* -------------------------
     SECURITY
  ------------------------- */
  async changePassword(payload: ChangePasswordPayload) {
    const res = await apiClient.post(`${BASE}/change-password`, payload);
    return res.data;
  },

  /* -------------------------
     DASHBOARD
  ------------------------- */
  async getDashboardStats() {
    try {
      const res = await apiClient.get<DashboardStatsResponse>(`${BASE}/dashboard-stats`);
      const d = res.data;

      return {
        pendingHospitals: d.pendingHospitals ?? d.pending_hospitals ?? 0,
        pendingDoctors: d.pendingDoctors ?? d.pending_doctors ?? 0,
        totalHospitals: d.totalHospitals ?? d.total_hospitals ?? 0,
        totalDoctors: d.totalDoctors ?? d.total_doctors ?? 0,
      };
    } catch {
      const [pendingHosp, approvedHosp, pendingDoc, approvedDoc] = await Promise.all([
        this.getHospitalRequests("pending").catch(() => []),
        this.getHospitals(true).catch(() => []),
        this.getDoctorRequests("pending").catch(() => []),
        this.getDoctors(true).catch(() => []),
      ]);

      return {
        pendingHospitals: pendingHosp.length,
        pendingDoctors: pendingDoc.length,
        totalHospitals: approvedHosp.length,
        totalDoctors: approvedDoc.length,
      };
    }
  },
};

export default AdminService;
