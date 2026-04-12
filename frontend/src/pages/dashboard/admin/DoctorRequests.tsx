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
import { Skeleton } from "../../../components/ui/skeleton";
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
      const data = await AdminService.getDoctorRequests("pending");

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
            <LoadingTable />
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

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/admin/doctor-requests/${req.id}/view`)
                          }
                        >
                          View
                        </Button>
                      </div>
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

function LoadingTable() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
