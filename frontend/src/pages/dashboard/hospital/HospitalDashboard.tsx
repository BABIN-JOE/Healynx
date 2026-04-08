// src/pages/dashboard/hospital/HospitalDashboard.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { Separator } from "../../../components/ui/separator";
import {
  Users,
  UserPlus,
  FolderLock,
  FileClock,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "../../../api/apiClient";

type StatsShape = {
  totalDoctors: number;
  pendingJoinRequests: number;
  pendingAccessRequests: number;
  pendingEntries: number;
  pendingProfileUpdates: number;
};

export default function HospitalDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsShape>({
    totalDoctors: 0,
    pendingJoinRequests: 0,
    pendingAccessRequests: 0,
    pendingEntries: 0,
    pendingProfileUpdates: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        setLoading(true);

        const res = await apiClient.get(
          "/api/v1/hospital/dashboard-stats"
        );

        if (!mounted) return;

        setStats({
          totalDoctors: res.data.totalDoctors ?? 0,
          pendingJoinRequests: res.data.pendingJoinRequests ?? 0,
          pendingAccessRequests: res.data.pendingAccessRequests ?? 0,
          pendingEntries: res.data.pendingEntries ?? 0,
          pendingProfileUpdates:
            res.data.pendingProfileUpdates ?? 0,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load hospital dashboard stats");
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
      <h1 className="text-2xl font-bold mb-1">
        Hospital Dashboard
      </h1>
      <p className="text-muted-foreground mb-6">
        Manage doctors, patient access, medical records, and profile updates.
      </p>

      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <DashboardCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={<Users className="h-6 w-6 text-primary" />}
          loading={loading}
        />

        <DashboardCard
          title="Pending Doctor Join Requests"
          value={stats.pendingJoinRequests}
          icon={<UserPlus className="h-6 w-6 text-blue-600" />}
          loading={loading}
        />

        <DashboardCard
          title="Pending Patient Access Requests"
          value={stats.pendingAccessRequests}
          icon={<FolderLock className="h-6 w-6 text-green-600" />}
          loading={loading}
        />

        <DashboardCard
          title="Pending Medical Entries"
          value={stats.pendingEntries}
          icon={<FileClock className="h-6 w-6 text-red-500" />}
          loading={loading}
        />

        <DashboardCard
          title="Pending Profile Updates"
          value={stats.pendingProfileUpdates}
          icon={<UserCog className="h-6 w-6 text-purple-600" />}
          loading={loading}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------
// Reusable Card
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
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 rounded-md" />
        ) : (
          <div className="text-3xl font-bold">
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}