// src/services/MasterService.ts

import api from "../api/apiClient";

const MasterService = {
  // ------------------------------------------
  // LIST ADMINS
  // ------------------------------------------
  listAdmins(params?: any) {
    return api.get("/api/v1/master/admins/list", { params });
  },

  // ------------------------------------------
  // SEARCH ADMINS
  // ------------------------------------------
  searchAdmins(query: string) {
    return api.get(
      `/api/v1/master/admins/search?q=${encodeURIComponent(query)}`
    );
  },

  // ------------------------------------------
  // CREATE ADMIN
  // ------------------------------------------
  createAdmin(data: any) {
    return api.post("/api/v1/master/admins/create", data);
  },

  // ------------------------------------------
  // GET ADMIN BY ID
  // ------------------------------------------
  getAdmin(id: string) {
    return api.get(`/api/v1/master/admins/${id}`);
  },

  // ------------------------------------------
  // GET FULL ADMIN DETAILS WITH STATS (NEW)
  // ------------------------------------------
  getAdminDetails(id: string) {
    return api.get(`/api/v1/master/admins/${id}/details`);
  },

  // ------------------------------------------
  // UPDATE ADMIN
  // ------------------------------------------
  updateAdmin(id: string, data: any) {
    return api.put(`/api/v1/master/admins/${id}`, data);
  },

  // ------------------------------------------
  // BLOCK ADMIN
  // ------------------------------------------
  blockAdmin(id: string) {
    return api.post(`/api/v1/master/admins/${id}/block`);
  },

  // ------------------------------------------
  // UNBLOCK ADMIN
  // ------------------------------------------
  unblockAdmin(id: string) {
    return api.post(`/api/v1/master/admins/${id}/unblock`);
  },

  // ------------------------------------------
  // DELETE ADMIN
  // ------------------------------------------
  deleteAdmin(id: string) {
    return api.delete(`/api/v1/master/admins/${id}`);
  },

  // ------------------------------------------
  // DASHBOARD STATS
  // ------------------------------------------
  getDashboardStats() {
    return api.get("/api/v1/master/dashboard-stats", { withCredentials: true });
  },
};

export default MasterService;
