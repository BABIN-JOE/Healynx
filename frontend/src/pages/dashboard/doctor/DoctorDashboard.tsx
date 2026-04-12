import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { FileText, FolderLock, Building2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../../../components/ui/alert";

export default function DoctorDashboard({
  hospitalStatus,
}: {
  hospitalStatus?: { mapped: boolean; hospital?: { id: string; name: string; license_number: string } } | null;
}) {

  const [stats, setStats] = useState({
    patient_access_requests: 0,
    pending_entries: 0,
  });

  const [hospitalInfo, setHospitalInfo] = useState<{
    mapped: boolean;
    hospital?: {
      id: string;
      name: string;
      license_number: string;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    if (hospitalStatus === undefined || hospitalStatus === null) {
      checkHospitalStatus();
    } else {
      setHospitalInfo(hospitalStatus);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hospitalStatus !== undefined && hospitalStatus !== null) {
      setHospitalInfo(hospitalStatus);
      setLoading(false);
    }
  }, [hospitalStatus]);

  async function loadStats() {
    try {
      const { data } = await apiClient.get("/api/v1/doctor/dashboard-stats");
      setStats(data);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  }

  async function checkHospitalStatus() {
    try {
      const { data } = await apiClient.get("/api/v1/doctor/my-hospital");
      setHospitalInfo(data);
    } catch (err) {
      console.error("Hospital status error:", err);
      setHospitalInfo({ mapped: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Doctor Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Access patient records and manage medical entries.
      </p>

      <Separator className="my-4" />

      {/* Hospital Status */}
      <div className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Hospital Status
            </CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : hospitalInfo?.mapped ? (
              <div>
                <div className="text-lg font-semibold text-green-700">
                  {hospitalInfo.hospital?.name}
                </div>
                <div className="text-sm text-gray-600">
                  License: {hospitalInfo.hospital?.license_number}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  ✓ Active hospital membership
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-semibold text-red-700">
                  Not Joined to Any Hospital
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Join a hospital to access patient records and create medical entries
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert if not mapped to hospital */}
      {!loading && !hospitalInfo?.mapped && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Access Restricted:</strong> Patient Access and Medical Entries features are disabled until you join a hospital.
            Please visit the <strong>Hospital</strong> tab to request membership.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards - Only show if mapped to hospital */}
      {hospitalInfo?.mapped && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Patient Access Requests
              </CardTitle>
              <FolderLock className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : stats.patient_access_requests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Pending Medical Entries
              </CardTitle>
              <FileText className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : stats.pending_entries}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}