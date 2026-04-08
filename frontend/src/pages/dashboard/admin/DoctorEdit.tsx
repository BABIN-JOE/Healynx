// frontend/src/pages/dashboard/admin/DoctorEdit.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

import { DoctorService } from "../../../services/DoctorService";

export default function DoctorEdit() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<any>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await DoctorService.getDoctor(doctorId!);
        const d = res.data;

        setDoctor({
          first_name: d.first_name || "",
          middle_name: d.middle_name || "",
          last_name: d.last_name || "",
          gender: d.gender || "",
          dob: d.dob || "",
          email: d.email || "",
          phone: d.phone || "",
          specialization: d.specialization || "",
          aadhaar: d.aadhaar || "",
          license_number: d.license_number || "",
          address: {
            house: d.address?.house || "",
            street: d.address?.street || "",
            city: d.address?.city || "",
            district: d.address?.district || "",
            state: d.address?.state || "",
            pincode: d.address?.pincode || "",
          },
        });
      } catch {
        toast.error("Failed to load doctor");
      }
    }

    load();
  }, [doctorId]);

  /* ================= UPDATE ================= */
  const update = (key: string, value: string) => {
    setDoctor((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (key: string, value: string) => {
    setDoctor((prev: any) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  };

  /* ================= SAVE ================= */
  const save = async () => {
    try {
      await DoctorService.updateDoctor(doctorId!, {
        first_name: doctor.first_name,
        middle_name: doctor.middle_name,
        last_name: doctor.last_name,
        gender: doctor.gender,
        dob: doctor.dob,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        address: doctor.address,
      });

      toast.success("Doctor updated");
      navigate("/admin/doctors");
    } catch {
      toast.error("Update failed");
    }
  };

  if (!doctor) return <div className="p-6">Loading...</div>;

  /* ================= UI ================= */
  return (
    <div className="p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Doctor</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* PERSONAL */}
          <TwoCols>
            <Field label="First Name" value={doctor.first_name}
              onChange={(v) => update("first_name", v)} />

            <Field label="Middle Name" value={doctor.middle_name}
              onChange={(v) => update("middle_name", v)} />
          </TwoCols>

          <Field label="Last Name" value={doctor.last_name}
            onChange={(v) => update("last_name", v)} />

          <TwoCols>
            {/* ✅ GENDER DROPDOWN */}
            <div>
              <Label>Gender</Label>
              <select
                value={doctor.gender}
                onChange={(e) => update("gender", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Field label="DOB" type="date" value={doctor.dob}
              onChange={(v) => update("dob", v)} />
          </TwoCols>

          <TwoCols>
            <Field label="Aadhaar" value={doctor.aadhaar} disabled />
            <Field label="License" value={doctor.license_number} disabled />
          </TwoCols>

          {/* CONTACT */}
          <TwoCols>
            <Field label="Phone" value={doctor.phone}
              onChange={(v) => update("phone", v)} />

            <Field label="Email" value={doctor.email}
              onChange={(v) => update("email", v)} />
          </TwoCols>

          <Field label="Specialization" value={doctor.specialization}
            onChange={(v) => update("specialization", v)} />

          {/* ADDRESS */}
          <h3 className="font-semibold mt-4">Address</h3>

          <Field label="House" value={doctor.address.house}
            onChange={(v) => updateAddress("house", v)} />

          <TwoCols>
            <Field label="Street" value={doctor.address.street}
              onChange={(v) => updateAddress("street", v)} />

            <Field label="City" value={doctor.address.city}
              onChange={(v) => updateAddress("city", v)} />
          </TwoCols>

          <TwoCols>
            <Field label="District" value={doctor.address.district}
              onChange={(v) => updateAddress("district", v)} />

            <Field label="State" value={doctor.address.state}
              onChange={(v) => updateAddress("state", v)} />
          </TwoCols>

          <Field label="Pincode" value={doctor.address.pincode}
            onChange={(v) => updateAddress("pincode", v)} />

          <Button className="w-full mt-4" onClick={save}>
            Save Changes
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}

/* ================= HELPERS ================= */

function Field({ label, value, onChange, type = "text", disabled = false }: any) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TwoCols({ children }: any) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}