// src/services/AuthService.ts
import api from "../api/apiClient";

export const AuthService = {
  // ------------------------------------------------------
  // MASTER LOGIN (returns JWT → stored securely in localStorage)
  // ------------------------------------------------------
  async masterLogin(data: { username: string; password: string }) {
    const res = await api.post("/api/v1/auth/master/login", data, {
      withCredentials: true,
    });

    // Master old system provided access_token, new system uses cookie.
    // But we still store the token if backend sends it (backward compatible).
    if (res.data?.access_token) {
      localStorage.setItem("masterToken", res.data.access_token);
    }

    return res;
  },

  // ------------------------------------------------------
  // ADMIN LOGIN (HttpOnly cookie, no token)
  // ------------------------------------------------------
  async adminLogin(data: { username: string; password: string }) {
    // backend sets HttpOnly cookie
    return api.post("/api/v1/auth/admin/login", data, {
      withCredentials: true,
    });
  },

  // ------------------------------------------------------
  // HOSPITAL LOGIN (HttpOnly cookie)
  // ------------------------------------------------------
  async hospitalLogin(data: { license_number: string; password: string }) {
    return api.post("/api/v1/auth/hospital/login", data, {
      withCredentials: true,
    });
  },

  // ------------------------------------------------------
  // DOCTOR LOGIN (HttpOnly cookie)
  // ------------------------------------------------------
  async doctorLogin(data: { username: string; password: string }) {
    return api.post("/api/v1/auth/doctor/login", data, {
      withCredentials: true,
    });
  },

  // ------------------------------------------------------
  // UNIVERSAL /me (works for admin, hospital, doctor, master IF cookie exists)
  // ------------------------------------------------------
  async me() {
    try {
      return await api.get("/api/v1/auth/me", { withCredentials: true });
    } catch {
      // fallback for master (token-based)
      const masterToken = localStorage.getItem("masterToken");
      if (!masterToken) throw new Error("Not authenticated");

      // manually decode (master only)
      const payload = JSON.parse(
        atob(masterToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );

      return { data: payload };
    }
  },

  // ------------------------------------------------------
  // LOGOUT (cookie + master token)
  // ------------------------------------------------------
  async logout() {
    try {
      await api.post("/api/v1/auth/logout", {}, { withCredentials: true });
    } catch {}

    localStorage.removeItem("masterToken");
  },

  // ------------------------------------------------------
  // Getter for master token only (if needed)
  // ------------------------------------------------------
  getMasterToken() {
    return localStorage.getItem("masterToken");
  },
};
