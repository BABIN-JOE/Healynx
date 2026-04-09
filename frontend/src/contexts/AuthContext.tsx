// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "../api/apiClient";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const inactivityTimer = useRef<any>(null);

  // ------------------------------------------------------
  // LOAD SESSION
  // ------------------------------------------------------
  const loadSession = async () => {
    try {
      const res = await api.get("/api/v1/auth/me", {
        withCredentials: true,
      });

      setUser(res.data);
      setRole(res.data.role);
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const hasLoaded = useRef(false);

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
    try {
      await api.post("/api/v1/auth/logout", {}, { withCredentials: true });
    } catch {}

    const endpointMap = {
      master: "/api/v1/auth/master/login",
      admin: "/api/v1/auth/admin/login",
      hospital: "/api/v1/auth/hospital/login",
      doctor: "/api/v1/auth/doctor/login",
    };

    await api.post(endpointMap[role], credentials, {
      withCredentials: true,
    });

    try {
      const res = await api.get("/api/v1/auth/me", {
        withCredentials: true,
      });

      setUser(res.data);
      setRole(res.data.role);
    } catch (err) {
      console.error("ME FAILED AFTER LOGIN", err);
      setUser(null);
      setRole(null);
    }

    setLoading(false);
  };

  // ------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------
  const logout = async () => {
    try {
      await api.post("/api/v1/auth/logout", {}, { withCredentials: true });
    } catch {}

    setUser(null);
    setRole(null);
  };

  // ------------------------------------------------------
  // 🔥 AUTO LOGOUT ON TAB CLOSE
  // ------------------------------------------------------
  useEffect(() => {
    const handleTabClose = () => {
      navigator.sendBeacon(
        "http://healynx.onrender.com/api/v1/auth/logout"
      );
    };

    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, []);

  // ------------------------------------------------------
  // 🔥 INACTIVITY LOGOUT (30 MIN)
  // ------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      inactivityTimer.current = setTimeout(async () => {
        console.warn("Auto logout due to inactivity");
        await logout();
        window.location.href = "/";
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // start timer

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
