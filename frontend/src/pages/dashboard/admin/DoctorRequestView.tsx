// src/pages/dashboard/admin/DoctorRequestView.tsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminService from "../../../services/AdminService";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeftIcon } from "../../../components/Icons";
import { toast } from "sonner";

export default function DoctorRequestView() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await AdminService.getDoctorRequestById(id!);
        setData({
          ...res,
          address: res.address || {},
        });
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load doctor request";

        console.error("API ERROR:", err);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!data) return <p className="p-4 text-red-600">Request not found.</p>;

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Doctor Request Details</h1>

        <Link to="/admin/doctor-requests">
          <Button variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
      </div>

      {/* DOCTOR INFORMATION */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <Info
            label="Full Name"
            value={`${data.first_name} ${data.middle_name ?? ""} ${data.last_name}`}
          />
          <Info label="Specialization" value={data.specialization} />
          <Info label="Date of Birth" value={data.dob} />
          <Info label="Gender" value={data.gender} />
          <Info label="License Number" value={data.license_number} />
          <Info label="Status" value={data.status} />
          <Info label="Submitted At" value={data.submitted_at || "-"} />
          <Info label="Reviewed At" value={data.reviewed_at || "—"} />
          <Info label="Reviewed By" value={data.reviewed_by || "—"} />
        </CardContent>
      </Card>

      {/* CONTACT + IDENTITY */}
      <Card>
        <CardHeader>
          <CardTitle>Identity & Contact</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <Info label="Aadhaar" value={data.aadhaar} />
          <Info label="Email" value={data.email} />
          <Info label="Phone" value={data.phone} />
        </CardContent>
      </Card>

      {/* HOSPITAL */}
      {data.hospital_id && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Hospital</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <Info label="Hospital ID" value={data.hospital_id} />
          </CardContent>
        </Card>
      )}

      {/* ADDRESS */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <Info label="House Details" value={data.address.house_details || "—"} />
          <Info label="Street" value={data.address.street || "—"} />
          <Info label="Locality" value={data.address.locality || "—"} />
          <Info label="City" value={data.address.city || "—"} />
          <Info label="District" value={data.address.district || "—"} />
          <Info label="State" value={data.address.state || "—"} />
          <Info label="Pincode" value={data.address.pincode || "—"} />
        </CardContent>
      </Card>
    </div>
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
