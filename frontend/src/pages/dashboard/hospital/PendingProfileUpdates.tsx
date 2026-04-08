import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { toast } from "sonner";
import apiClient from "../../../api/apiClient";

export default function PendingProfileUpdates() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const res = await apiClient.get(
        "/api/v1/hospital/pending-profile-updates"
      );
      setRequests(res.data);
    } catch {
      toast.error("Failed to load profile update requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(
        `/api/v1/hospital/pending-profile-updates/${id}/approve`
      );
      toast.success("Profile update approved");
      loadRequests();
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await apiClient.post(
        `/api/v1/hospital/pending-profile-updates/${id}/decline`
      );
      toast.success("Profile update declined");
      loadRequests();
    } catch {
      toast.error("Decline failed");
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="p-6 text-gray-500">
        No pending profile update requests.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Pending Profile Updates
      </h1>

      {requests.map((req) => {
        const changes = req.requested_changes;

        return (
          <Card key={req.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div>
                  {req.patient_name}
                  <p className="text-sm text-gray-500 font-normal">
                    Requested by Dr. {req.doctor_name}
                  </p>
                </div>

                <Badge variant="outline">
                  Expires {new Date(req.expires_at).toLocaleString()}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Separator />

              <div className="space-y-2 text-sm">
                {changes.blood_group && (
                  <div>
                    <strong>Blood Group:</strong> {changes.blood_group}
                  </div>
                )}

                {changes.phone && (
                  <div>
                    <strong>Contact:</strong> {changes.phone}
                  </div>
                )}

                {changes.emergency_contact && (
                  <div>
                    <strong>Emergency Contact:</strong> {changes.emergency_contact}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-3 justify-end">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(req.id)}
                >
                  Approve
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDecline(req.id)}
                >
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}