// src/pages/dashboard/master/AdminEdit.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import MasterService from "../../../services/MasterService";

import { ArrowLeftIcon } from "../../../components/Icons";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// shadcn UI
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select";

export default function AdminEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<any>({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    dob: "",
    phone: "",
    email: "",
    username: "",
    aadhaar: "", // visible but NOT editable
    address: {
      house_and_name: "",
      street: "",
      locality: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
    },
  });

  const updateForm = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  // ---------------------------------------------------------
  // LOAD ADMIN
  // ---------------------------------------------------------
  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const res = await MasterService.getAdmin(id!);
        const data = res.data;

        const addr = data.address || {};

        const addressObj = {
          house_and_name: addr.house_details || addr.house_and_name || "",
          street: addr.street || "",
          locality: addr.locality || "",
          city: addr.city || "",
          district: addr.district || "",
          state: addr.state || "",
          pincode: addr.pincode || "",
        };

        setForm({
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          gender: data.gender,
          dob: data.dob,
          phone: data.phone,
          email: data.email,
          username: data.username,
          aadhaar: data.aadhaar || "************", // visible
          address: addressObj,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load admin");
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [id]);

  // ---------------------------------------------------------
  // SUBMIT UPDATE
  // ---------------------------------------------------------
  const handleUpdate = async () => {
    try {
      // VALIDATIONS
      if (!form.first_name || !form.last_name) {
        toast.error("First and last name are required");
        return;
      }

      if (!/^\d{10}$/.test(form.phone)) {
        toast.error("Phone number must be exactly 10 digits");
        return;
      }

      if (!/^\d{6}$/.test(form.address.pincode)) {
        toast.error("Pincode must be exactly 6 digits");
        return;
      }

      // Convert address to backend format
      const mappedAddress = {
        house_details: form.address.house_and_name,
        street: form.address.street,
        locality: form.address.locality,
        city: form.address.city,
        district: form.address.district,
        state: form.address.state,
        pincode: form.address.pincode,
      };

      const payload = {
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        gender: form.gender,
        dob: form.dob,
        phone: form.phone,
        email: form.email,
        username: form.username,
        address: mappedAddress,
        // ❌ Aadhaar is NOT sent — cannot be edited
      };

      await MasterService.updateAdmin(id!, payload);

      toast.success("Admin updated successfully!");
      navigate("/master/admins");
    } catch (err: any) {
      console.error(err);

      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.response?.data?.message;

      if (msg?.includes("username")) toast.error("Username already exists");
      else if (msg?.includes("email")) toast.error("Email already exists");
      else if (msg?.includes("phone")) toast.error("Phone number already exists");
      else toast.error(msg || "Failed to update admin");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-lg text-center">
        Loading admin details…
      </div>
    );

  return (
    <>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold">Edit Admin</h1>

        <Button variant="outline" onClick={() => navigate("/master/admins")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      </motion.div>

      {/* FORM */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-6 rounded-xl shadow space-y-6"
      >
        {/* ------------------- PERSONAL INFO ------------------- */}
        <h2 className="text-xl font-semibold mb-3">Personal Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="First Name *"
            value={form.first_name}
            onChange={(e) => updateForm("first_name", e.target.value)}
          />

          <Input
            placeholder="Middle Name"
            value={form.middle_name}
            onChange={(e) => updateForm("middle_name", e.target.value)}
          />

          <Input
            placeholder="Last Name *"
            value={form.last_name}
            onChange={(e) => updateForm("last_name", e.target.value)}
          />

          <Select
            value={form.gender}
            onValueChange={(v) => updateForm("gender", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Gender *" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={form.dob}
            onChange={(e) => updateForm("dob", e.target.value)}
          />

          {/* Aadhaar — Visible but NOT editable */}
          <Input
            placeholder="Aadhaar Number"
            value={form.aadhaar}
            disabled
            className="opacity-70 cursor-not-allowed"
          />
        </div>

        {/* ------------------- CONTACT INFO ------------------- */}
        <h2 className="text-xl font-semibold mt-6 mb-3">Contact Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Phone *"
            value={form.phone}
            maxLength={10}
            onChange={(e) => updateForm("phone", e.target.value)}
          />

          <Input
            placeholder="Email *"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
          />

          <Input
            placeholder="Username *"
            value={form.username}
            onChange={(e) => updateForm("username", e.target.value)}
          />
        </div>

        {/* ------------------- ADDRESS ------------------- */}
        <h2 className="text-xl font-semibold mt-6 mb-3">Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="House No / Name *"
            value={form.address.house_and_name}
            onChange={(e) =>
              updateAddress("house_and_name", e.target.value)
            }
          />

          <Input
            placeholder="Street (Optional)"
            value={form.address.street}
            onChange={(e) => updateAddress("street", e.target.value)}
          />

          <Input
            placeholder="Locality / Area *"
            value={form.address.locality}
            onChange={(e) => updateAddress("locality", e.target.value)}
          />

          <Input
            placeholder="City *"
            value={form.address.city}
            onChange={(e) => updateAddress("city", e.target.value)}
          />

          <Input
            placeholder="District *"
            value={form.address.district}
            onChange={(e) => updateAddress("district", e.target.value)}
          />

          <Input
            placeholder="State *"
            value={form.address.state}
            onChange={(e) => updateAddress("state", e.target.value)}
          />

          <Input
            placeholder="Pincode *"
            maxLength={6}
            value={form.address.pincode}
            onChange={(e) => updateAddress("pincode", e.target.value)}
          />
        </div>

        {/* SUBMIT */}
        <div className="mt-6">
          <Button size="lg" onClick={handleUpdate}>
            Save Changes
          </Button>
        </div>
      </motion.div>
    </>
  );
}
