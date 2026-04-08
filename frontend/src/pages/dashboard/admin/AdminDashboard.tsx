// src/pages/dashboard/admin/AdminDashboard.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { Separator } from "../../../components/ui/separator";
import { Hospital, UserCog, User, HeartPulse } from "lucide-react";
import AdminService from "../../../services/AdminService";
import { toast } from "sonner"; // ✅ FIXED — correct import

type StatsShape = {
  pendingHospitals: number;
  pendingDoctors: number;
  totalHospitals: number;
  totalDoctors: number;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsShape>({
    pendingHospitals: 0,
    pendingDoctors: 0,
    totalHospitals: 0,
    totalDoctors: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        const s = await AdminService.getDashboardStats();
        if (mounted) setStats(s);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard stats"); // ✅ FIXED type safety
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Manage hospitals, doctors and patients.
      </p>

      <Separator className="my-4" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        <DashboardCard
          title="Pending Hospital Requests"
          value={stats.pendingHospitals}
          icon={<Hospital className="h-6 w-6 text-primary" />}
          loading={loading}
        />

        <DashboardCard
          title="Pending Doctor Requests"
          value={stats.pendingDoctors}
          icon={<UserCog className="h-6 w-6 text-primary" />}
          loading={loading}
        />

        <DashboardCard
          title="Total Hospitals"
          value={stats.totalHospitals}
          icon={<User className="h-6 w-6 text-green-600" />}
          loading={loading}
        />

        <DashboardCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={<HeartPulse className="h-6 w-6 text-red-500" />}
          loading={loading}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------
// 🔥 Reusable Dashboard Card Component
// ----------------------------------------------
function DashboardCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 rounded-md" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
