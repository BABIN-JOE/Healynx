// src/pages/dashboard/admin/HospitalView.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminService from "../../../services/AdminService";
import { ArrowLeftIcon } from "../../../components/Icons";
import { motion } from "framer-motion";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import toast from "react-hot-toast";

export default function HospitalView() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await AdminService.getHospitalById(hospitalId!);

        const addr = res.address || {};

        setHospital({
          ...res,
          address: {
            house_details: addr.house_details || "",
            street: addr.street || "",
            locality: addr.locality || "",
            city: addr.city || "",
            district: addr.district || "",
            state: addr.state || "",
            pincode: addr.pincode || "",
          },
        });
      } catch (err) {
        console.error("API ERROR:", err);
        toast.error("Failed to load hospital");
      } finally {
        setLoading(false);
      }
    };

    if (hospitalId) load();
  }, [hospitalId]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!hospital) return <p className="p-4 text-red-600">Hospital not found.</p>;

  return (
    <>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold">Hospital Details</h1>

        <Button variant="outline" onClick={() => navigate("/admin/hospitals")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Hospital Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Info label="Hospital Name" value={hospital.hospital_name} />
            <Info label="License Number" value={hospital.license_number} />

            <Info
              label="Owner Name"
              value={`${hospital.owner_first_name} ${hospital.owner_middle_name ?? ""} ${hospital.owner_last_name}`}
            />

            <Info label="Owner Aadhaar" value={hospital.owner_aadhaar} />
            <Info label="Email" value={hospital.email} />
            <Info label="Phone" value={hospital.phone} />
          </CardContent>
        </Card>

        {/* RIGHT CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Info label="House / Details" value={hospital.address.house_details} />
            <Info label="Street" value={hospital.address.street} />
            <Info label="Locality" value={hospital.address.locality} />
            <Info label="City" value={hospital.address.city} />
            <Info label="District" value={hospital.address.district} />
            <Info label="State" value={hospital.address.state} />
            <Info label="Pincode" value={hospital.address.pincode} />
          </CardContent>
        </Card>
      </div>

      {/* META */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Hospital Metadata</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Info label="Submitted At" value={hospital.submitted_at || "—"} />
          <Info label="Created At" value={hospital.created_at || "—"} />
          <Info label="Approved By" value={hospital.approved_by || "—"} />
          <Info label="Approved At" value={hospital.approved_at || "—"} />
          <Info label="Active" value={hospital.is_active ? "Yes" : "No"} />
        </CardContent>
      </Card>
    </>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
