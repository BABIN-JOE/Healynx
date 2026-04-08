// src/pages/dashboard/admin/PatientView.tsx

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

type Address = {
  house_details?: string;
  street?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

export default function PatientView() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await AdminService.getPatientById(patientId!);
        const data = res?.data || res;

        let parsedAddress: Address = {};

        try {
          if (typeof data.address === "string") {
            parsedAddress = JSON.parse(data.address);
          } else if (typeof data.address === "object" && data.address !== null) {
            parsedAddress = data.address;
          }
        } catch (err) {
          console.error("Failed to parse address", err);
        }

        setPatient({
          ...data,
          blood_group: data.blood_group ?? "",
          address: {
            house_details: parsedAddress.house_details || "",
            street: parsedAddress.street || "",
            locality: parsedAddress.locality || "",
            city: parsedAddress.city || "",
            district: parsedAddress.district || "",
            state: parsedAddress.state || "",
            pincode: parsedAddress.pincode || "",
          },
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load patient details");
      } finally {
        setLoading(false);
      }
    };

    if (patientId) load();
  }, [patientId]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!patient) return <p className="p-4 text-red-600">Patient not found.</p>;

  return (
    <>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold">Patient Details</h1>

        <Button variant="outline" onClick={() => navigate("/admin/patients")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      </motion.div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PERSONAL INFO */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Info
              label="Full Name"
              value={`${patient.first_name} ${patient.middle_name ?? ""} ${patient.last_name}`}
            />
            <Info label="Gender" value={patient.gender} />
            <Info label="Date of Birth" value={patient.dob} />
            <Info label="Blood Group" value={patient.blood_group} />
            <Info label="Phone" value={patient.phone} />
            <Info label="Emergency Contact" value={patient.emergency_contact} />
            <Info label="Email" value={patient.email} />
            <Info label="Aadhaar" value={patient.aadhaar} />
            <Info label="Father Name" value={patient.father_name} />
            <Info label="Mother Name" value={patient.mother_name} />
          </CardContent>
        </Card>

        {/* ADDRESS */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Info label="House / Details" value={patient.address.house_details} />
            <Info label="Street" value={patient.address.street} />
            <Info label="Locality" value={patient.address.locality} />
            <Info label="City" value={patient.address.city} />
            <Info label="District" value={patient.address.district} />
            <Info label="State" value={patient.address.state} />
            <Info label="Pincode" value={patient.address.pincode} />
          </CardContent>
        </Card>
      </div>

      {/* META */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Patient Metadata</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Info
            label="Created By"
            value={patient.created_by_admin?.username || "Unknown"}
          />
          <Info label="Created At" value={patient.created_at} />
          <Info label="Active" value={patient.is_active ? "Yes" : "No"} />
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------
   Reusable Info Row
------------------------------------ */
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-slate-800">
        {value && value !== "" ? value : "—"}
      </span>
    </div>
  );
}
