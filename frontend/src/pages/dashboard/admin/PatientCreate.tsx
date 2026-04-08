// src/pages/dashboard/admin/PatientCreate.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "sonner";
import AdminService from "../../../services/AdminService";

export default function PatientCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    dob: "",
    blood_group: "",
    father_name: "",
    mother_name: "",
    house_details: "",
    street: "",
    locality: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    phone: "",
    emergency_contact: "",
    email: "",
    aadhaar: "",
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (
      !form.first_name ||
      !form.last_name ||
      !form.gender ||
      !form.dob ||
      !form.blood_group ||
      !form.father_name ||
      !form.mother_name ||
      !form.house_details ||
      !form.locality ||
      !form.city ||
      !form.district ||
      !form.state ||
      !form.pincode ||
      !form.phone ||
      !form.emergency_contact ||
      form.phone === form.emergency_contact ||
      !form.aadhaar
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        gender: form.gender,
        dob: form.dob,
        blood_group: form.blood_group,
        father_name: form.father_name,
        mother_name: form.mother_name,
        address: {
          house_details: form.house_details,
          street: form.street || null,
          locality: form.locality,
          city: form.city,
          district: form.district,
          state: form.state,
          pincode: form.pincode,
        },
        phone: form.phone,
        emergency_contact: form.emergency_contact,
        email: form.email || null,
        aadhaar: form.aadhaar,
      };

      await AdminService.createPatient(payload);

      toast.success("Patient created successfully");
      navigate("/admin/patients");
    } catch (err: any) {
      console.error(err);

      const detail = err?.response?.data?.detail;

      if (Array.isArray(detail)) {
        toast.error(detail.map((e) => e.msg).join(", "));
      } else if (typeof detail === "string") {
        toast.error(detail);
      } else {
        toast.error("Failed to create patient");
      }
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add Patient</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <TwoCols>
            <Field
              label="First Name"
              required
              value={form.first_name}
              onChange={(v: string) => update("first_name", v)}
            />
            <Field
              label="Middle Name"
              value={form.middle_name}
              onChange={(v: string) => update("middle_name", v)}
            />
          </TwoCols>

          <Field
            label="Last Name"
            required
            value={form.last_name}
            onChange={(v: string) => update("last_name", v)}
          />

          <TwoCols>
            <GenderSelect
              value={form.gender}
              onChange={(v: string) => update("gender", v)}
            />

            <Field
              label="Date of Birth"
              type="date"
              required
              value={form.dob}
              onChange={(v: string) => update("dob", v)}
            />
          </TwoCols>

          <BloodGroupSelect
            value={form.blood_group}
            onChange={(v: string) => update("blood_group", v)}
          />

          <TwoCols>
            <Field
              label="Father Name"
              required
              value={form.father_name}
              onChange={(v: string) => update("father_name", v)}
            />
            <Field
              label="Mother Name"
              required
              value={form.mother_name}
              onChange={(v: string) => update("mother_name", v)}
            />
          </TwoCols>

          <h2 className="font-semibold mt-4">Address</h2>

          <TwoCols>
            <Field
              label="House Details"
              required
              value={form.house_details}
              onChange={(v: string) => update("house_details", v)}
            />
            <Field
              label="Street"
              value={form.street}
              onChange={(v: string) => update("street", v)}
            />
          </TwoCols>

          <TwoCols>
            <Field
              label="Locality"
              required
              value={form.locality}
              onChange={(v: string) => update("locality", v)}
            />
            <Field
              label="City"
              required
              value={form.city}
              onChange={(v: string) => update("city", v)}
            />
          </TwoCols>

          <TwoCols>
            <Field
              label="District"
              required
              value={form.district}
              onChange={(v: string) => update("district", v)}
            />
            <Field
              label="State"
              required
              value={form.state}
              onChange={(v: string) => update("state", v)}
            />
          </TwoCols>

          <Field
            label="Pincode"
            required
            value={form.pincode}
            onChange={(v: string) => update("pincode", v)}
          />

          <TwoCols>
            <Field
              label="Phone"
              required
              value={form.phone}
              onChange={(v: string) => update("phone", v)}
            />
            <Field
              label="Emergency Contact"
              required
              value={form.emergency_contact}
              onChange={(v: string) => update("emergency_contact", v)}
            />
          </TwoCols>

          <Field
            label="Email"
            value={form.email}
            onChange={(v: string) => update("email", v)}
          />

          <Field
            label="Aadhaar"
            required
            value={form.aadhaar}
            onChange={(v: string) => update("aadhaar", v)}
          />

          <Button className="w-full mt-4" onClick={handleSubmit}>
            Create Patient
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function TwoCols({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: any) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function GenderSelect({ value, onChange }: any) {
  return (
    <div>
      <Label>
        Gender <span className="text-red-500 ml-1">*</span>
      </Label>
      <select
        className="w-full border rounded-md px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
    </div>
  );
}

function BloodGroupSelect({ value, onChange }: any) {
  return (
    <div>
      <Label>
        Blood Group <span className="text-red-500 ml-1">*</span>
      </Label>
      <select
        className="w-full border rounded-md px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select blood group</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>
    </div>
  );
}
