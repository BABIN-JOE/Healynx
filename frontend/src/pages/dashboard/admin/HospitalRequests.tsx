// src/pages/dashboard/admin/HospitalRequests.tsx
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Skeleton } from "../../../components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AdminService, { HospitalRequestSummary } from "../../../services/AdminService";

export default function HospitalRequests() {
  const [requests, setRequests] = useState<HospitalRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getHospitalRequests("pending");
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load hospital requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await AdminService.approveHospital(id);
      toast.success("Hospital approved successfully");
      loadRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await AdminService.rejectHospital(id);
      toast.success("Hospital rejected");
      loadRequests();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Rejection failed");
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Hospital Requests</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingTable />
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No requests found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital Name</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.hospital_name}</TableCell>
                    <TableCell>{req.license_number}</TableCell>
                    <TableCell>{req.owner_name}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleApprove(req.id)}>
                          Approve
                        </Button>

                        <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>
                          Reject
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/hospital-requests/${req.id}/view`)}
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
