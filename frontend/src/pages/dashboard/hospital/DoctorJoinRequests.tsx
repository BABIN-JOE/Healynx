import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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


type JoinReq = {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string;
  submitted_at?: string;
};

const POLL_MS = 10_000;

const DoctorJoinRequests: React.FC = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<JoinReq[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // approve / decline modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] =
    useState<"approve" | "decline" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await HospitalService.getJoinRequests();
      const requestsData = Array.isArray(data) ? data : [];
      requestsData.sort((a, b) => {
        const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return bTime - aTime;
      });
      setRequests(requestsData);
    } catch (err: any) {
      console.error("Load join requests failed", err);
      setError(err?.message || "Failed to load requests");
      toast.error("Failed to load join requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    pollRef.current = window.setInterval(loadRequests, POLL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const openConfirm = (id: string, action: "approve" | "decline") => {
    setSelectedId(id);
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedId || !confirmAction) return;
    try {
      if (confirmAction === "approve") {
        await HospitalService.approveJoinRequest(selectedId);
        toast.success("Doctor approved");
      } else {
        await HospitalService.declineJoinRequest(selectedId);
        toast.success("Request declined");
      }
      setShowConfirm(false);
      setSelectedId(null);
      setConfirmAction(null);
      await loadRequests();
    } catch (err: any) {
      console.error("Action failed", err);
      toast.error(err?.message || "Action failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Doctor Join Requests</h1>
        <Button onClick={loadRequests} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="mb-2 text-sm text-gray-600">Loading...</div>
      )}
      {error && (
        <div className="mb-2 text-sm text-red-600">Error: {error}</div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor</TableHead>
            <TableHead>License</TableHead>
            <TableHead>Requested At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                No join requests
              </TableCell>
            </TableRow>
          )}

          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell>
                {req.first_name} {req.last_name}
              </TableCell>
              <TableCell>{req.license_number}</TableCell>
              <TableCell>
                {req.submitted_at
                  ? new Date(req.submitted_at).toLocaleString()
                  : "-"}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/hospital/doctor-join-requests/${req.id}`)
                  }
                >
                  View
                </Button>
                <Button onClick={() => openConfirm(req.id, "approve")}>
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openConfirm(req.id, "decline")}
                >
                  Decline
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Approve / Decline confirm modal */}
      {showConfirm && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowConfirm(false)}
          />
          <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              {confirmAction === "approve"
                ? "Approve doctor?"
                : "Decline request?"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to {confirmAction} this join request?
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

export default DoctorJoinRequests;
