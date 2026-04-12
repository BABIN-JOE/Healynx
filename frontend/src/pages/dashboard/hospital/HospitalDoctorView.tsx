// src/pages/dashboard/hospital/HospitalDoctorView.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HospitalService from "../../../services/HospitalService";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { ArrowLeftIcon } from "../../../components/Icons";

export default function HospitalDoctorView() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) return;

    (async () => {
      try {
        const data = await HospitalService.getDoctorById(doctorId);
        setDoctor(data);
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Doctor not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!doctor) return <p className="p-4 text-red-600">Doctor not found</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Doctor Details</h1>
        <Button variant="outline" onClick={() => navigate("/hospital/doctors")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Info label="Full Name" value={`${doctor.first_name} ${doctor.middle_name ?? ""} ${doctor.last_name}`} />
            <Info label="Gender" value={doctor.gender} />
            <Info label="Specialization" value={doctor.specialization} />
            <Info label="License Number" value={doctor.license_number} />
            <Info label="Email" value={doctor.email || "—"} />
            <Info label="Phone" value={doctor.phone || "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hospital Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Info label="Role" value={doctor.role || "doctor"} />
            <Info label="Joined At" value={doctor.joined_at || "—"} />
          </CardContent>
        </Card>
      </div>
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
