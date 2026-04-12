// src/pages/dashboard/admin/HospitalRequestView.tsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminService from "../../../services/AdminService";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowLeftIcon } from "../../../components/Icons";
import { toast } from "sonner";

export default function HospitalRequestView() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await AdminService.getHospitalRequestById(id!);

        let address = {};
        try {
          address = res.address ? JSON.parse(res.address) : {};
        } catch {
          address = {};
        }

        setData({
          ...res,
          address,
        });
      } catch (err) {
        toast.error("Failed to load request");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hospital Request Details</h1>
        <Link to="/admin/hospital-requests">
          <Button variant="outline">
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
      </div>

      {/* HOSPITAL INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Hospital Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Info label="Hospital Name" value={data.hospital_name} />
          <Info label="License Number" value={data.license_number} />
          <Info label="Status" value={data.status} />
          <Info label="Submitted At" value={data.submitted_at} />
          <Info label="Reviewed At" value={data.reviewed_at || "—"} />
          <Info label="Reviewed By" value={data.reviewed_by || "—"} />
        </CardContent>
      </Card>

      {/* OWNER INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Info label="Owner Name" value={data.owner_name} />
          <Info label="Owner Aadhaar" value={data.owner_aadhaar} />
          <Info label="Email" value={data.email || "—"} />
          <Info label="Phone" value={data.phone || "—"} />
        </CardContent>
      </Card>

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
      <span className="text-slate-600 font-medium">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
