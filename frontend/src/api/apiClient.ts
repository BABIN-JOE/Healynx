// src/api/apiClient.ts

import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

// ======================================================
// 🌐 API BASE URL
// ======================================================
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  "https://healynx.onrender.com";

// ======================================================
// 🍪 COOKIE HELPER
// ======================================================
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) return null;

  const value = cookie.slice(name.length + 1);
  return decodeURIComponent(value);
}

// ======================================================
// 🔐 CSRF TOKEN MANAGEMENT
// ======================================================
let csrfToken: string | null = readCookie("csrf_token");

export function syncCsrfTokenFromCookies() {
  const cookieToken = readCookie("csrf_token");
  csrfToken = cookieToken || null;
}

export function getCsrfToken() {
  syncCsrfTokenFromCookies();
  return csrfToken;
}

export function clearClientAuthState() {
  csrfToken = null;

  if (typeof document !== "undefined") {
    document.cookie =
      "csrf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

// ======================================================
// 🚫 LOGOUT CONTROL FLAG
// Prevents token refresh after logout
// ======================================================
let isLoggingOut = false;

export function setLogoutInProgress(value: boolean) {
  isLoggingOut = value;
}

// ======================================================
// 🚫 INITIAL AUTH CHECK FLAG
// Prevents refresh during initial session validation
// ======================================================
let isInitializingAuth = false;

export function setAuthInitialization(value: boolean) {
  isInitializingAuth = value;
}

// ======================================================
// 🚀 AXIOS INSTANCE
// ======================================================
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

// ======================================================
// 📤 REQUEST INTERCEPTOR (ATTACH CSRF TOKEN)
// ======================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    syncCsrfTokenFromCookies();

    const method = config.method?.toUpperCase();

    if (
      csrfToken &&
      method &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method)
    ) {
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }

      if (config.headers instanceof AxiosHeaders) {
        config.headers.set("X-CSRF-Token", csrfToken);
      } else {
        (config.headers as Record<string, string>)["X-CSRF-Token"] =
          csrfToken;
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ======================================================
// 🔁 TOKEN REFRESH HANDLING
// ======================================================
let isRefreshing = false;

let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(null);
    }
  });
  failedQueue = [];
};

// ======================================================
// 📥 RESPONSE INTERCEPTOR
// ======================================================
api.interceptors.response.use(
  (response) => {
    // Update CSRF token from response headers if present
    const token = response.headers["x-csrf-token"];
    if (token) {
      csrfToken = token as string;
    } else {
      syncCsrfTokenFromCookies();
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest?.url || "";

    // 🚫 Do not refresh during logout
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    // 🚫 Do not refresh during initial auth check
    if (isInitializingAuth) {
      return Promise.reject(error);
    }

    // Skip refresh for authentication-related endpoints
    const skipRefresh =
      url.includes("/auth/master/login") ||
      url.includes("/auth/admin/login") ||
      url.includes("/auth/hospital/login") ||
      url.includes("/auth/doctor/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout") ||
      url.includes("/auth/me");

    if (status !== 401 || skipRefresh) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Queue requests while refresh is in progress
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
      await api.post(
        "/api/v1/auth/refresh",
        {},
        { withCredentials: true }
      );

      processQueue();
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      clearClientAuthState();

      if (typeof window !== "undefined") {
        window.location.replace("/");
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;