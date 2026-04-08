// src/pages/dashboard/admin/DoctorView.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminService from "../../../services/AdminService";
import { ArrowLeftIcon } from "../../../components/Icons";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

export default function DoctorView() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("PARAM doctorId:", doctorId);
    const load = async () => {
      try {
        const res = await AdminService.getDoctorById(doctorId!);
        const data = res?.data || res;

        const addr = data.address || {};

        setDoctor({
          ...data,
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
        toast.error("Failed to load doctor details");
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) load();
  }, [doctorId]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!doctor) return <p className="p-4 text-red-600">Doctor not found.</p>;

  return (
    <>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold">Doctor Details</h1>

        <Button variant="outline" onClick={() => navigate("/admin/doctors")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      </motion.div>

      {/* 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PERSONAL INFO */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Info label="Full Name" value={`${doctor.first_name} ${doctor.middle_name ?? ""} ${doctor.last_name}`} />
            <Info label="Gender" value={doctor.gender} />
            <Info label="Date of Birth" value={doctor.dob} />
            <Info label="Email" value={doctor.email || "—"} />
            <Info label="Phone" value={doctor.phone || "—"} />
            <Info label="Specialization" value={doctor.specialization} />
            <Info label="License Number" value={doctor.license_number} />
            <Info label="Aadhaar" value={doctor.aadhaar} />
          </CardContent>
        </Card>

        {/* ADDRESS */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Info label="House / Details" value={doctor.address.house_details} />
            <Info label="Street" value={doctor.address.street} />
            <Info label="Locality" value={doctor.address.locality} />
            <Info label="City" value={doctor.address.city} />
            <Info label="District" value={doctor.address.district} />
            <Info label="State" value={doctor.address.state} />
            <Info label="Pincode" value={doctor.address.pincode} />
          </CardContent>
        </Card>

      </div>

      {/* HOSPITAL INFO */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Hospital</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Info label="Hospital Name" value={doctor.hospital_name || "Not Assigned"} />
          <Info label="Hospital License Number" value={doctor.hospital_license_number || "—"} />
        </CardContent>
      </Card>

      {/* META */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Doctor Metadata</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Info label="Registered At" value={doctor.created_at || "—"} />
          <Info label="Approved By" value={doctor.approved_by || "—"} />
          <Info label="Approved At" value={doctor.approved_at || "—"} />
          <Info label="Active" value={doctor.is_active ? "Yes" : "No"} />
        </CardContent>
      </Card>
    </>
  );
}

function Info({ label, value }: any) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
