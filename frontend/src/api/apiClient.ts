// src/api/apiClient.ts

import axios from "axios";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || "https://healynx.onrender.com";

const api = axios.create({
  baseURL: "https://healynx.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

// ------------------------------------------------------
// 🍪 COOKIE HELPER
// ------------------------------------------------------
function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

// ------------------------------------------------------
// 🔐 CSRF INTERCEPTOR (FIXED)
// ------------------------------------------------------
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();

  // ✅ Only for state-changing requests
  const shouldAttachCSRF =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE";

  if (shouldAttachCSRF) {
    const csrf = getCookie("csrf_token");

    if (csrf && config.headers) {
      config.headers.set("X-CSRF-Token", csrf);
    }
  }

  return config;
});

// ------------------------------------------------------
// 🔁 REFRESH SYSTEM (QUEUE-BASED)
// ------------------------------------------------------

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // ❌ Ignore non-401
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // ❌ DO NOT refresh if no refresh token exists
    const hasRefreshToken = document.cookie.includes("refresh_token=");
    if (!hasRefreshToken) {
      return Promise.reject(error);
    }

    // ❌ Prevent retry loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ❌ Don't intercept refresh itself
    if (originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // 🔁 Queue handling
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      await api.post("/api/v1/auth/refresh", {}, { withCredentials: true });

      processQueue();

      return api(originalRequest);

    } catch (err) {
      processQueue(err);

      console.error("AUTH FAILED → redirecting");

      window.location.href = "/";

      return Promise.reject(err);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;