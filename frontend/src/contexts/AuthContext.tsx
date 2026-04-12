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
  setAuthInitialization,
  setLogoutInProgress,
  syncCsrfTokenFromCookies,
} from "../api/apiClient";
import { shouldResetSessionOnLaunch, startTabSession } from "../auth/tabSession";

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------
interface AuthContextType {
  user: any | null;
  role: string | null;
  loading: boolean;
  login: (
    role: "master" | "admin" | "hospital" | "doctor",
    credentials: any
  ) => Promise<any | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

const LOGIN_SYNC_KEY = "healynx_login";
const LOGOUT_SYNC_KEY = "healynx_logout";
const INACTIVITY_LIMIT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasLoaded = useRef(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuthState = () => {
    clearClientAuthState();
    setUser(null);
    setRole(null);
  };

  const fetchCurrentUser = async () => {
    const response = await api.get("/api/v1/auth/me", {
      withCredentials: true,
    });

    return response.data;
  };

  const loadSession = async () => {
    setLoading(true);
    setAuthInitialization(true);

    try {
      const sessionUser = await fetchCurrentUser();
      syncCsrfTokenFromCookies();
      setUser(sessionUser);
      setRole(sessionUser.role);
      return sessionUser;
    } catch {
      try {
        // Re-sync CSRF token by calling the dedicated endpoint
        await api.get("/api/v1/auth/csrf", {
          withCredentials: true,
        });
        
        // After getting CSRF from endpoint, sync it from cookies
        syncCsrfTokenFromCookies();

        await api.post(
          "/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );

        const refreshedUser = await fetchCurrentUser();
        syncCsrfTokenFromCookies();
        setUser(refreshedUser);
        setRole(refreshedUser.role);
        return refreshedUser;
      } catch {
        clearAuthState();
        return null;
      }
    } finally {
      setAuthInitialization(false);
      setLoading(false);
    }
  };

  const verifySession = async () => {
    try {
      const sessionUser = await fetchCurrentUser();
      syncCsrfTokenFromCookies();
      if (sessionUser) {
        setUser(sessionUser);
        setRole(sessionUser.role);
      }
      return;
    } catch {
      try {
        syncCsrfTokenFromCookies();
        await api.get("/api/v1/auth/csrf", {
          withCredentials: true,
        });
        syncCsrfTokenFromCookies();
        await api.post(
          "/api/v1/auth/refresh",
          {},
          { withCredentials: true }
        );
        const refreshedUser = await fetchCurrentUser();
        syncCsrfTokenFromCookies();
        if (refreshedUser) {
          setUser(refreshedUser);
          setRole(refreshedUser.role);
        }
        return;
      } catch {
        clearAuthState();
        window.location.replace("/");
      }
    }
  };

  const resetStaleBrowserSession = async () => {
    syncCsrfTokenFromCookies();

    try {
      await api.post(
        "/api/v1/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch {
      // Best effort cleanup for stale browser sessions.
    } finally {
      clearAuthState();
    }
  };

  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }

    hasLoaded.current = true;

    const resetSessionOnLaunch = shouldResetSessionOnLaunch();
    const stopTabSession = startTabSession();

    void (async () => {
      if (resetSessionOnLaunch) {
        await resetStaleBrowserSession();
      }

      await loadSession();
    })();

    return () => {
      stopTabSession();
    };
  }, []);

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

    // After login, immediately sync CSRF token
    syncCsrfTokenFromCookies();

    // Explicitly fetch CSRF token from server and re-sync
    try {
      await api.get("/api/v1/auth/csrf", {
        withCredentials: true,
      });
      syncCsrfTokenFromCookies();
    } catch {
      // If CSRF endpoint fails, just proceed with what we have
    }

    const sessionUser = await loadSession();
    window.localStorage.setItem(LOGIN_SYNC_KEY, Date.now().toString());
    return sessionUser;
  };

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
      // The client state still needs to be cleared even if the server session is already gone.
    } finally {
      clearAuthState();
      window.localStorage.setItem(LOGOUT_SYNC_KEY, Date.now().toString());
      window.location.replace("/");
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOGOUT_SYNC_KEY) {
        clearAuthState();
        window.location.replace("/");
        return;
      }

      if (event.key === LOGIN_SYNC_KEY) {
        void loadSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      inactivityTimer.current = setTimeout(() => {
        void logout();
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer);
    });

    resetTimer();

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const interval = window.setInterval(() => {
      void verifySession();
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void verifySession();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
