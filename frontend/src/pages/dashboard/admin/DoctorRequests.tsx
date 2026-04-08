// src/pages/dashboard/admin/DoctorRequests.tsx

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { toast } from "sonner";
import AdminService, {
  DoctorRequestSummary,
} from "../../../services/AdminService";
import { useNavigate } from "react-router-dom";

export default function DoctorRequests() {
  const [requests, setRequests] = useState<DoctorRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getDoctorRequests();

      // Ensure full_name exists
      const normalized = data.map((d: any) => ({
        ...d,
        full_name:
          d.full_name ||
          `${d.first_name ?? ""} ${d.middle_name ?? ""} ${d.last_name ?? ""}`.trim(),
      }));

      setRequests(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load doctor requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await AdminService.approveDoctor(id);
      toast.success("Doctor approved");
      loadRequests();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Failed to approve doctor request"
      );
    }
  };

  const handleReject = async (id: string) => {
    try {
      await AdminService.rejectDoctor(id);
      toast.success("Doctor rejected");
      loadRequests();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Failed to reject doctor request"
      );
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Doctor Requests
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No doctor requests found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.full_name || "—"}</TableCell>
                    <TableCell>{req.specialization || "—"}</TableCell>
                    <TableCell>{req.license_number}</TableCell>
                    <TableCell>{req.phone || "—"}</TableCell>
                    <TableCell>{req.email || "—"}</TableCell>

                    <TableCell>
                      <Badge variant="default">{req.status}</Badge>
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/doctor-requests/${req.id}/view`)
                        }
                      >
                        View
                      </Button>

                      {req.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(req.id)}>
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(req.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
