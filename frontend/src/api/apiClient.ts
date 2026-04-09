import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

// ------------------------------------------------------
// 🌐 API BASE URL
// ------------------------------------------------------
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  "https://healynx.onrender.com";

// ------------------------------------------------------
// 🚀 AXIOS INSTANCE
// ------------------------------------------------------
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true, // Required for cookie-based authentication
});

// ------------------------------------------------------
// 🍪 COOKIE HELPER
// ------------------------------------------------------
function getCookie(name: string): string | null {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// ------------------------------------------------------
// 🔐 CSRF INTERCEPTOR
// ------------------------------------------------------
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const method = config.method?.toUpperCase();

    // Attach CSRF token only for state-changing requests
    if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const csrfToken = getCookie("csrf_token");

      if (csrfToken) {
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
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ------------------------------------------------------
// 🔁 TOKEN REFRESH SYSTEM (QUEUE-BASED)
// ------------------------------------------------------
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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest?.url || "";

    // Skip refresh for specific endpoints
    const skipRefresh =
      url.includes("/auth/login") ||
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

    // Queue requests during token refresh
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
    } catch (refreshError) {
      processQueue(refreshError);
      console.error("Session expired. Redirecting to login.");

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;