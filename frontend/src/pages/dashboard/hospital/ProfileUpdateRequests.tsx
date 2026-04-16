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

type UpdateRequest = {
  id: string;
  patient_name: string;
  doctor_name: string;
  requested_changes: Record<string, any>;
  expires_at: string;
  can_act: boolean;
};

const POLL_MS = 10_000;

const ProfileUpdateRequests: React.FC = () => {
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const pollRef = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await HospitalService.getProfileUpdateRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile update requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-polling disabled to prevent constant refreshing
    // pollRef.current = window.setInterval(load, POLL_MS);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const approve = async (id: string) => {
    try {
      await HospitalService.approveProfileUpdate(id);
      toast.success("Profile update approved");
      load();
    } catch {
      toast.error("Approval failed");
    }
  };

  const decline = async (id: string) => {
    try {
      await HospitalService.declineProfileUpdate(id);
      toast.success("Profile update declined");
      load();
    } catch {
      toast.error("Decline failed");
    }
  };

  const renderChanges = (changes: Record<string, any>) => {
    return Object.entries(changes).map(([key, value]) => (
      <div key={key} className="text-sm">
        <span className="font-medium capitalize">
          {key.replace("_", " ")}:
        </span>{" "}
        {value}
      </div>
    ));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Profile Update Requests</h1>
        <Button onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Doctor</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Requested Changes</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {requests.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-gray-500"
              >
                No profile update requests
              </TableCell>
            </TableRow>
          )}

          {requests.map((r) => (
            <TableRow
              key={r.id}
              className={!r.can_act ? "opacity-60 bg-gray-50" : ""}
            >
              <TableCell>{r.doctor_name}</TableCell>
              <TableCell>{r.patient_name}</TableCell>

              <TableCell>{renderChanges(r.requested_changes)}</TableCell>

              <TableCell>
                {new Date(r.expires_at).toLocaleString()}
              </TableCell>

              <TableCell className="space-x-2">
                <Button
                  onClick={() => approve(r.id)}
                  disabled={!r.can_act}
                >
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => decline(r.id)}
                  disabled={!r.can_act}
                >
                  Decline
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProfileUpdateRequests;