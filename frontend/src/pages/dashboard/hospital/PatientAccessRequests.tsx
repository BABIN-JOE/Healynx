// src/pages/dashboard/hospital/PatientAccessRequests.tsx

import React, { useEffect, useState, useRef } from "react";
import HospitalService from "../../../services/HospitalService";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "../../../components/ui/table";
import { toast } from "sonner";

type AccessReq = {
  id: string;
  status?: string;
  expires_in?: number;
  can_act?: boolean;

  doctor_name?: string;
  patient_name?: string;
};

const POLL_MS = 10_000;

const PatientAccessRequests: React.FC = () => {
  const [requests, setRequests] = useState<AccessReq[]>([]);
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] =
    useState<"approve" | "decline" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  // =========================================================
  // LOAD DATA
  // =========================================================
  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await HospitalService.getPatientAccessRequests();

      const filtered = Array.isArray(data)
        ? data.filter((r: AccessReq) => r.status === "pending")
        : [];

      setRequests(filtered);

      // initialize timers from backend
      const initialTimers: Record<string, number> = {};

      filtered.forEach((r: AccessReq) => {
        initialTimers[r.id] = r.expires_in ?? 0;
      });

      setTimers(initialTimers);
    } catch (err) {
      console.error(err);
      setError("Failed to load access requests");
      toast.error("Failed to load patient access requests");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD + POLLING
  // =========================================================
  useEffect(() => {
    load();
    pollRef.current = window.setInterval(load, POLL_MS);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  // =========================================================
  // COUNTDOWN TIMER
  // =========================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated: Record<string, number> = {};

        Object.keys(prev).forEach((key) => {
          updated[key] = Math.max(prev[key] - 1, 0);
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // FORMAT TIMER
  // =========================================================
  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "Expired";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}m ${secs}s`;
  };

  // =========================================================
  // CONFIRM ACTION
  // =========================================================
  const openConfirm = (id: string, action: "approve" | "decline") => {
    setSelectedId(id);
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedId || !confirmAction) return;

    try {
      if (confirmAction === "approve") {
        await HospitalService.approvePatientAccess(selectedId);
        toast.success("Access approved");
      } else {
        await HospitalService.declinePatientAccess(selectedId);
        toast.success("Request declined");
      }

      setShowConfirm(false);
      setSelectedId(null);
      setConfirmAction(null);

      await load();
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Patient Access Requests</h1>

        <Button onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="mb-2 text-sm text-gray-600">Loading...</div>
      )}

      {error && (
        <div className="mb-2 text-sm text-red-600">{error}</div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                No access requests
              </TableCell>
            </TableRow>
          )}

          {requests.map((r) => {
            const seconds = timers[r.id] ?? 0;

            return (
              <TableRow
                key={r.id}
                className={!r.can_act || seconds <= 0 ? "opacity-60 bg-gray-50" : ""}
              >
                <TableCell>{r.doctor_name || "-"}</TableCell>
                <TableCell>{r.patient_name || "-"}</TableCell>

                <TableCell>
                  {formatTime(seconds)}
                </TableCell>

                <TableCell className="space-x-2">
                  <Button
                    onClick={() => openConfirm(r.id, "approve")}
                    disabled={!r.can_act || seconds <= 0}
                  >
                    Approve
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => openConfirm(r.id, "decline")}
                    disabled={!r.can_act || seconds <= 0}
                  >
                    Decline
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {showConfirm && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />

          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              {confirmAction === "approve"
                ? "Approve access?"
                : "Decline request?"}
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              {confirmAction === "approve"
                ? "This will grant the doctor access to patient records."
                : "This will decline the access request."}
            </p>

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleConfirm}>
                {confirmAction === "approve" ? "Approve" : "Decline"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAccessRequests;
