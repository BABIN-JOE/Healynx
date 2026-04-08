import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import api from "../../../api/apiClient";
import { toast } from "sonner";

interface Session {
  id: string;
  user_agent: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
}

export default function DoctorSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------
  // LOAD SESSIONS
  // ------------------------------------------------------
  const loadSessions = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/v1/auth/sessions", {
        withCredentials: true,
      });

      setSessions(res.data);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // ------------------------------------------------------
  // REVOKE SESSION
  // ------------------------------------------------------
  const revokeSession = async (id: string) => {
    try {
      await api.post(`/api/v1/auth/sessions/${id}/revoke`, {}, {
        withCredentials: true,
      });

      toast.success("Session revoked");

      // refresh list
      loadSessions();
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  // ------------------------------------------------------
  // FORMAT DATE
  // ------------------------------------------------------
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <div className="p-4">

      <h1 className="text-2xl font-bold mb-4">
        Active Sessions
      </h1>

      {loading ? (
        <p className="text-sm text-gray-500">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-500">
          No active sessions found
        </p>
      ) : (
        <div className="space-y-3">

          {sessions.map((s) => (

            <div
              key={s.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >

              <div className="space-y-1">

                <p className="font-medium text-sm">
                  {s.user_agent || "Unknown Device"}
                </p>

                <p className="text-xs text-gray-500">
                  IP: {s.ip_address || "Unknown"}
                </p>

                <p className="text-xs text-gray-500">
                  Started: {formatDate(s.created_at)}
                </p>

                <p className="text-xs text-gray-500">
                  Expires: {formatDate(s.expires_at)}
                </p>

              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => revokeSession(s.id)}
              >
                Revoke
              </Button>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}