// src/pages/dashboard/master/AdminView.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MasterService from "../../../services/MasterService";

import { ArrowLeftIcon } from "../../../components/Icons";
import { motion } from "framer-motion";
import { toast } from "sonner";

// shadcn UI
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export default function AdminView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  // ----------------------------------------------
  // LOAD ADMIN DETAILS
  // ----------------------------------------------
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const res = await MasterService.getAdmin(id!);
        const data = res.data;

        const addr = data.address || {};

        // FIX — Backend/Frontend mapping
        const mappedAddress = {
          house_and_name: addr.house_and_name || addr.house_details || "",
          street: addr.street || "",
          locality: addr.locality || "",
          city: addr.city || "",
          district: addr.district || "",
          state: addr.state || "",
          pincode: addr.pincode || "",
        };

        setAdmin({ ...data, address: mappedAddress });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load admin details");
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center text-lg">
        Loading admin details…
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="p-10 text-center text-lg text-red-600">
        Admin not found.
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold">Admin Details</h1>

        <Button variant="outline" onClick={() => navigate("/master/admins")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT SIDE – BASIC INFO */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Info
              label="Name"
              value={`${admin.first_name} ${admin.middle_name ?? ""} ${admin.last_name}`}
            />
            <Info label="Gender" value={admin.gender} />
            <Info label="Date of Birth" value={admin.dob} />
            <Info label="Username" value={admin.username} />

            {/* 🔥 Aadhaar now displayed */}
            <Info label="Aadhaar Number" value={admin.aadhaar ?? "—"} />

            <Info label="Email" value={admin.email ?? "—"} />
            <Info label="Phone" value={admin.phone ?? "—"} />
          </CardContent>
        </Card>

        {/* RIGHT SIDE – ADDRESS */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Info label="House / Name" value={admin.address.house_and_name ?? "—"} />
            <Info label="Street" value={admin.address.street || "—"} />
            <Info label="Locality / Area" value={admin.address.locality ?? "—"} />
            <Info label="City" value={admin.address.city ?? "—"} />
            <Info label="District" value={admin.address.district ?? "—"} />
            <Info label="State" value={admin.address.state ?? "—"} />
            <Info label="Pincode" value={admin.address.pincode ?? "—"} />
          </CardContent>
        </Card>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <StatCard
          label="Patients Created"
          value={admin.stats?.patients_created ?? 0}
          color="bg-indigo-500"
        />
        <StatCard
          label="Doctors Approved"
          value={admin.stats?.doctors_approved ?? 0}
          color="bg-green-500"
        />
        <StatCard
          label="Hospitals Approved"
          value={admin.stats?.hospitals_approved ?? 0}
          color="bg-blue-500"
        />
      </div>

      {/* TIMESTAMP SECTION */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Admin Metadata</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Info label="Created At" value={admin.created_at ?? "—"} />
          <Info label="Blocked" value={admin.is_blocked ? "Yes" : "No"} />
          <Info label="Active" value={admin.is_active ? "Active" : "Inactive"} />
        </CardContent>
      </Card>
    </>
  );
}

/* ---------------------------------------------
   REUSABLE COMPONENTS
---------------------------------------------- */

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: any) {
  return (
    <motion.div
      className={`${color} text-white p-6 rounded-xl shadow`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-lg opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </motion.div>
  );
}
