import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { FileText, FolderLock } from "lucide-react";

export default function DoctorDashboard() {

  const [stats, setStats] = useState({
    patient_access_requests: 0,
    pending_entries: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data } = await apiClient.get("/api/v1/doctor/dashboard-stats");
      setStats(data);
    } catch (err) {
      console.error("Dashboard error:", err);
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
    </div>
  );
}