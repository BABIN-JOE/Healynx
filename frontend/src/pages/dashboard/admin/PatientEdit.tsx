// frontend/src/pages/dashboard/admin/PatientEdit.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { toast } from "sonner";
import AdminService from "../../../services/AdminService";

type Errors = Record<string, string>;

export default function PatientEdit() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [errors, setErrors] = useState<Errors>({});

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await AdminService.getPatientById(patientId!);
        const data = res?.data ?? res;

        let address: any = {};
        if (typeof data.address === "string") {
          try {
            address = JSON.parse(data.address);
          } catch {
            address = {};
          }
        } else if (typeof data.address === "object" && data.address !== null) {
          address = data.address;
        }

        setPatient({
          ...data,
          middle_name: data.middle_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          emergency_contact: data.emergency_contact ?? "",
          blood_group: data.blood_group ?? "",
          address: {
            house_details: address.house_details ?? "",
            street: address.street ?? "",
            city: address.city ?? "",
            district: address.district ?? "",
            state: address.state ?? "",
            pincode: address.pincode ?? "",
          },
        });
      } catch {
        toast.error("Failed to load patient");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [patientId]);

  /* ================= UPDATE ================= */
  const update = (path: string, value: string) => {
    if (path.startsWith("address.")) {
      const key = path.split(".")[1];
      setPatient((prev: any) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    } else {
      setPatient((prev: any) => ({ ...prev, [path]: value }));
    }
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    const e: Errors = {};

    // Personal (MANDATORY)
    if (!patient.first_name?.trim()) e.first_name = "Required";
    if (!patient.last_name?.trim()) e.last_name = "Required";
    if (!patient.gender?.trim()) e.gender = "Required";
    if (!patient.dob?.trim()) e.dob = "Required";
    if (!patient.blood_group?.trim()) e.blood_group = "Required";
    if (!patient.father_name?.trim()) e.father_name = "Required";
    if (!patient.mother_name?.trim()) e.mother_name = "Required";
    if (!patient.phone?.trim()) e.phone = "Required";
    if (!patient.emergency_contact?.trim())e.emergency_contact = "Required";

    // Address (MANDATORY except street)
    if (!patient.address.house_details?.trim()) e.house_details = "Required";
    if (!patient.address.city?.trim()) e.city = "Required";
    if (!patient.address.district?.trim()) e.district = "Required";
    if (!patient.address.state?.trim()) e.state = "Required";
    if (!patient.address.pincode?.trim()) e.pincode = "Required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SAVE ================= */
  const save = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      const payload = {
        first_name: patient.first_name,
        middle_name: patient.middle_name || undefined,
        last_name: patient.last_name,
        gender: patient.gender,
        dob: patient.dob,
        blood_group: patient.blood_group,
        father_name: patient.father_name,
        mother_name: patient.mother_name,
        phone: patient.phone,
        emergency_contact: patient.emergency_contact,
        email: patient.email || undefined,
        address_obj: patient.address,
      };

      await AdminService.updatePatient(patientId!, payload);
      toast.success("Patient updated successfully");
      navigate("/admin/patients");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Update failed");
    }
  };

  if (loading || !patient) return <Loading />;

  /* ================= UI ================= */
  return (
    <div className="p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Patient</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <TwoCols>
            <Field label="First Name *" value={patient.first_name} error={errors.first_name}
              onChange={(v) => update("first_name", v)} />
            <Field label="Middle Name" value={patient.middle_name}
              onChange={(v) => update("middle_name", v)} />
          </TwoCols>

          <Field label="Last Name *" value={patient.last_name} error={errors.last_name}
            onChange={(v) => update("last_name", v)} />

          <TwoCols>
            <Field label="Gender *" value={patient.gender} error={errors.gender}
              onChange={(v) => update("gender", v)} />
            <Field label="DOB *" type="date" value={patient.dob} error={errors.dob}
              onChange={(v) => update("dob", v)} />
          </TwoCols>

          <div>
            <Label className={errors.blood_group ? "text-red-600" : ""}>
              Blood Group *
            </Label>
            <select
              value={patient.blood_group}
              onChange={(e) => update("blood_group", e.target.value)}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                errors.blood_group ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
            {errors.blood_group && (
              <p className="text-xs text-red-600 mt-1">{errors.blood_group}</p>
            )}
          </div>

          <TwoCols>
            <Field label="Father Name *" value={patient.father_name} error={errors.father_name}
              onChange={(v) => update("father_name", v)} />
            <Field label="Mother Name *" value={patient.mother_name} error={errors.mother_name}
              onChange={(v) => update("mother_name", v)} />
          </TwoCols>

          <h3 className="font-semibold mt-4">Address</h3>

          <Field label="House Details *" value={patient.address.house_details} error={errors.house_details}
            onChange={(v) => update("address.house_details", v)} />

          <TwoCols>
            <Field label="Street" value={patient.address.street}
              onChange={(v) => update("address.street", v)} />
            <Field label="City *" value={patient.address.city} error={errors.city}
              onChange={(v) => update("address.city", v)} />
          </TwoCols>

          <TwoCols>
            <Field label="District *" value={patient.address.district} error={errors.district}
              onChange={(v) => update("address.district", v)} />
            <Field label="State *" value={patient.address.state} error={errors.state}
              onChange={(v) => update("address.state", v)} />
          </TwoCols>

          <Field label="Pincode *" value={patient.address.pincode} error={errors.pincode}
            onChange={(v) => update("address.pincode", v)} />

          <TwoCols>
            <Field label="Phone *" value={patient.phone} error={errors.phone}
              onChange={(v) => update("phone", v)}
            />
            <Field label="Emergency Contact *" value={patient.emergency_contact} error={errors.emergency_contact}
              onChange={(v) => update("emergency_contact", v)}
            />
          </TwoCols>

          <Field
            label="Email"
            value={patient.email}
            onChange={(v) => update("email", v)}
          />

          <Button className="w-full mt-4" onClick={save}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= HELPERS ================= */

function Field({ label, value, onChange, error, type = "text" }: any) {
  return (
    <div>
      <Label className={error ? "text-red-600" : ""}>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function TwoCols({ children }: any) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Loading() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Skeleton className="h-6 w-64 mb-4" />
      <Skeleton className="h-10 w-full mb-3" />
    </div>
  );
}
