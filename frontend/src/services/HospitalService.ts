// src/services/HospitalService.ts

import apiClient from "../api/apiClient";

const HospitalService = {
  /* =========================
     PROFILE
  ========================= */
  async getProfile() {
    const res = await apiClient.get("/api/v1/hospital/me");
    return res.data;
  },

  /* =========================
     DOCTORS
  ========================= */
  async getDoctors() {
    const res = await apiClient.get("/api/v1/hospital/doctors/");
    return res.data;
  },

  async getDoctorById(doctorId: string) {
    const res = await apiClient.get(
      `/api/v1/hospital/doctors/${doctorId}`
    );
    return res.data;
  },

  async removeDoctor(doctorId: string) {
    const res = await apiClient.post(
      `/api/v1/hospital/doctors/${doctorId}/soft-delete`
    );
    return res.data;
  },

  /* =========================
     DOCTOR JOIN REQUESTS
  ========================= */
  async getJoinRequests() {
    const res = await apiClient.get(
      "/api/v1/hospital/doctor-join-requests/"
    );
    return res.data;
  },

  async getDoctorJoinRequestDetails(reqId: string) {
    const res = await apiClient.get(
      `/api/v1/hospital/doctor-join-requests/${reqId}`
    );
    return res.data;
  },

  async approveJoinRequest(reqId: string) {
    const res = await apiClient.post(
      `/api/v1/hospital/doctor-join-requests/${reqId}/approve`
    );
    return res.data;
  },

  async declineJoinRequest(reqId: string) {
    const res = await apiClient.post(
      `/api/v1/hospital/doctor-join-requests/${reqId}/reject`
    );
    return res.data;
  },

  async getHospital(id: string) {
    const { data } = await apiClient.get(`/api/v1/admin/hospitals/${id}`);
    return { data };
  },

  async updateHospital(id: string, payload: any) {
    const { data } = await apiClient.put(`/api/v1/admin/hospitals/${id}`, payload);
    return { data };
  },
  /* =========================
     PATIENT ACCESS REQUESTS
  ========================= */

  async getPatientAccessRequests() {
    const res = await apiClient.get(
      "/api/v1/hospital/medical/access-requests/"
    );
    return res.data;
  },

  async approvePatientAccess(reqId: string) {
    const res = await apiClient.post(
      `/api/v1/hospital/medical/access-requests/${reqId}/approve`
    );
    return res.data;
  },

  async declinePatientAccess(reqId: string) {
    const res = await apiClient.post(
      `/api/v1/hospital/medical/access-requests/${reqId}/decline`
    );
    return res.data;
  },

  /* =========================
     PENDING MEDICAL ENTRIES
  ========================= */

  async getPendingEntries() {
    const res = await apiClient.get(
      "/api/v1/hospital/medical/entries/pending/"
    );
    return res.data;
  },

  async getPendingEntry(id: string) {
    const { data } = await apiClient.get(
      `/api/v1/hospital/medical/entries/pending/${id}`
    );
    return data;
  },

  async approvePendingEntry(id: string) {
    const res = await apiClient.post(
      `/api/v1/hospital/medical/entries/pending/${id}/approve`
    );
    return res.data;
  },

  async declinePendingEntry(id: string, reason: string) {
    const { data } = await apiClient.post(
      `/api/v1/hospital/medical/entries/pending/${id}/decline`,
      { reason }
    );
    return data;
  },

  /* =========================
   PROFILE UPDATE REQUESTS
  ========================= */

  async getProfileUpdateRequests() {
    const { data } = await apiClient.get(
      "/api/v1/hospital/pending-profile-updates"
    );
    return data;
  },

  async approveProfileUpdate(id: string) {
    const { data } = await apiClient.post(
      `/api/v1/hospital/pending-profile-updates/${id}/approve`
    );
    return data;
  },

  async declineProfileUpdate(id: string) {
    const { data } = await apiClient.post(
      `/api/v1/hospital/pending-profile-updates/${id}/decline`
    );
    return data;
  },
  /* =========================
     CHANGE PASSWORD
  ========================= */
  async changePassword(payload: { old_password: string; new_password: string }) {
    const res = await apiClient.post("/api/v1/hospital/change-password", payload);
    return res.data;
  },
};

export default HospitalService;
