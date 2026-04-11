// src/contexts/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import api, {
  clearClientAuthState,
  syncCsrfTokenFromCookies,
  setLogoutInProgress,
} from "../api/apiClient";

interface AuthContextType {
  user: any | null;
  role: string | null;
  loading: boolean;
  login: (
    role: "master" | "admin" | "hospital" | "doctor",
    credentials: any
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  // ------------------------------------------------------
  // CLEAR AUTH STATE
  // ------------------------------------------------------
  const clearAuthState = () => {
    clearClientAuthState();
    setUser(null);
    setRole(null);
  };

  // ------------------------------------------------------
  // LOAD SESSION (PERSIST AFTER REFRESH)
  // ------------------------------------------------------
  const loadSession = async () => {
    setLoading(true);
    syncCsrfTokenFromCookies();

    try {
      const res = await api.get("/api/v1/auth/me", {
        withCredentials: true,
      });

      setUser(res.data);
      setRole(res.data.role);
    } catch {
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadSession();
  }, []);

  // ------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------
  const login = async (
    role: "master" | "admin" | "hospital" | "doctor",
    credentials: any
  ) => {
    const endpointMap = {
      master: "/api/v1/auth/master/login",
      admin: "/api/v1/auth/admin/login",
      hospital: "/api/v1/auth/hospital/login",
      doctor: "/api/v1/auth/doctor/login",
    };

    await api.post(endpointMap[role], credentials, {
      withCredentials: true,
    });

    await loadSession();

    // Sync login across tabs
    localStorage.setItem("healynx_login", Date.now().toString());
  };

  // ------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------
  const logout = async () => {
    syncCsrfTokenFromCookies();
    setLogoutInProgress(true);

    try {
      await api.post(
        "/api/v1/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch {
      // Ignore failures; session may already be invalidated
    } finally {
      clearAuthState();

      // Sync logout across tabs
      localStorage.setItem("healynx_logout", Date.now().toString());

      // Reset logout flag
      setLogoutInProgress(false);

      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    }
  };

  // ------------------------------------------------------
  // CROSS-TAB AUTH SYNC
  // ------------------------------------------------------
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "healynx_logout") {
        clearAuthState();
        window.location.href = "/";
      }

      if (event.key === "healynx_login") {
        loadSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ------------------------------------------------------
  // AUTO LOGOUT ON TAB CLOSE
  // ------------------------------------------------------
  useEffect(() => {
    const handleTabClose = () => {
      try {
        const baseURL =
          import.meta.env.VITE_API_BASE ||
          "https://healynx.onrender.com";

        navigator.sendBeacon(`${baseURL}/api/v1/auth/logout`);
      } catch {
        // Ignore failures
      }
    };

    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, []);

  // ------------------------------------------------------
  // INACTIVITY AUTO LOGOUT
  // ------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      inactivityTimer.current = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);