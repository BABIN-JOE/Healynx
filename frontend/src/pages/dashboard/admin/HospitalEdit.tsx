// frontend/src/pages/dashboard/admin/HospitalEdit.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { toast } from "sonner";

import HospitalService from "../../../services/HospitalService";

export default function HospitalEdit() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState<any>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await HospitalService.getHospital(hospitalId!);
        const d = res.data;

        setHospital({
          name: d.name || "",
          owner_name: d.owner_name || "",
          owner_aadhaar: d.owner_aadhaar || "",
          email: d.email || "",
          phone: d.phone || "",
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
        toast.error("Failed to load hospital");
      }
    }

    load();
  }, [hospitalId]);

  /* ================= UPDATE ================= */
  const update = (key: string, value: string) => {
    setHospital((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (key: string, value: string) => {
    setHospital((prev: any) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  };

  /* ================= SAVE ================= */
  const save = async () => {
    try {
      await HospitalService.updateHospital(hospitalId!, {
        owner_name: hospital.owner_name,
        owner_aadhaar: hospital.owner_aadhaar,
        email: hospital.email,
        phone: hospital.phone,
        address: hospital.address,
      });

      toast.success("Hospital updated");
      navigate("/admin/hospitals");
    } catch {
      toast.error("Update failed");
    }
  };

  if (!hospital) return <div className="p-6">Loading...</div>;

  /* ================= UI ================= */
  return (
    <div className="p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Hospital</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* BASIC INFO */}
          <TwoCols>
            <Field label="Hospital Name" value={hospital.name} disabled />
            <Field label="Owner Name" value={hospital.owner_name}
              onChange={(v) => update("owner_name", v)} />
          </TwoCols>

          <TwoCols>
            <Field label="Owner Aadhaar" value={hospital.owner_aadhaar}
              onChange={(v) => update("owner_aadhaar", v)} />
            <Field label="License" value={hospital.license_number} disabled />
          </TwoCols>

          {/* CONTACT */}
          <TwoCols>
            <Field label="Email" value={hospital.email}
              onChange={(v) => update("email", v)} />

            <Field label="Phone" value={hospital.phone}
              onChange={(v) => update("phone", v)} />
          </TwoCols>

          {/* ADDRESS */}
          <h3 className="font-semibold mt-4">Address</h3>

          <Field label="House" value={hospital.address.house}
            onChange={(v) => updateAddress("house", v)} />

          <TwoCols>
            <Field label="Street" value={hospital.address.street}
              onChange={(v) => updateAddress("street", v)} />

            <Field label="City" value={hospital.address.city}
              onChange={(v) => updateAddress("city", v)} />
          </TwoCols>

          <TwoCols>
            <Field label="District" value={hospital.address.district}
              onChange={(v) => updateAddress("district", v)} />

            <Field label="State" value={hospital.address.state}
              onChange={(v) => updateAddress("state", v)} />
          </TwoCols>

          <Field label="Pincode" value={hospital.address.pincode}
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
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

function TwoCols({ children }: any) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}