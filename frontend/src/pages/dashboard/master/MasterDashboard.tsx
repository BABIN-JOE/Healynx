// frontend/src/pages/dashboard/master/MasterDashboard.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MasterService from "../../../services/MasterService";

export default function MasterDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    total_admins: number;
    total_hospitals: number;
    total_doctors: number;
    total_patients: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await MasterService.getDashboardStats();
        if (!mounted) return;
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load master dashboard stats", err);
        // fallback to 0s if something fails
        if (mounted) {
          setStats({
            total_admins: 0,
            total_hospitals: 0,
            total_doctors: 0,
            total_patients: 0,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <motion.h1
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Master Dashboard
      </motion.h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          title="Total Admins"
          loading={loading}
          value={stats ? stats.total_admins : undefined}
          color="bg-indigo-500"
        />

        <StatCard
          title="Hospitals Approved"
          loading={loading}
          value={stats ? stats.total_hospitals : undefined}
          color="bg-green-500"
        />

        <StatCard
          title="Doctors Registered"
          loading={loading}
          value={stats ? stats.total_doctors : undefined}
          color="bg-blue-500"
        />
      </div>

      {/* Welcome Box */}
      <motion.div
        className="bg-white shadow rounded-xl p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-xl font-bold mb-3">Welcome Master Admin 🎉</h2>
        <p className="text-slate-600 leading-relaxed">
          Manage administrators, hospitals, doctors, and settings from the side
          menu. You have full control over the platform.
        </p>
      </motion.div>
    </>
  );
}

function StatCard({
  title,
  value,
  loading,
  color,
}: {
  title: string;
  value?: number;
  loading: boolean;
  color: string;
}) {
  return (
    <motion.div
      className={`p-6 rounded-xl text-white shadow ${color}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-lg opacity-90">{title}</p>
      <p className="text-3xl font-bold mt-2">
        {loading ? "..." : value !== undefined ? value : "—"}
      </p>
    </motion.div>
  );
}
