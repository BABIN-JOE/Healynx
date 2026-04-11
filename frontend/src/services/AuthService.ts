import api from "../api/apiClient";

export const AuthService = {
  async masterLogin(data: { username: string; password: string }) {
    return api.post("/api/v1/auth/master/login", data, {
      withCredentials: true,
    });
  },

  async adminLogin(data: { username: string; password: string }) {
    return api.post("/api/v1/auth/admin/login", data, {
      withCredentials: true,
    });
  },

  async hospitalLogin(data: { license_number: string; password: string }) {
    return api.post("/api/v1/auth/hospital/login", data, {
      withCredentials: true,
    });
  },

  async doctorLogin(data: { username: string; password: string }) {
    return api.post("/api/v1/auth/doctor/login", data, {
      withCredentials: true,
    });
  },

  async me() {
    return api.get("/api/v1/auth/me", { withCredentials: true });
  },

  async logout() {
    return api.post("/api/v1/auth/logout", {}, { withCredentials: true });
  },
};
