// src/pages/dashboard/master/AdminCreate.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import MasterService from "../../../services/MasterService";

import { ArrowLeftIcon } from "../../../components/Icons";

import { motion } from "framer-motion";
import { toast } from "sonner";

// shadcn UI
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "../../../components/ui/select";

export default function AdminCreate() {
  const navigate = useNavigate();

  // ---------------------------------
  // FORM STATE
  // ---------------------------------
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    dob: "",
    aadhaar: "",
    phone: "",
    email: "",
    username: "",
    password: "",

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

  // ---------------------------------
  // HANDLERS
  // ---------------------------------
  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  // ---------------------------------
  // SUBMIT HANDLER
  // ---------------------------------
  const handleSubmit = async () => {
    try {
      // BASIC FIELD CHECK
      if (
        !form.first_name ||
        !form.last_name ||
        !form.gender ||
        !form.dob ||
        !form.aadhaar ||
        !form.phone ||
        !form.email ||
        !form.username ||
        !form.password
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      // 🔒 Aadhaar validation
      if (!/^\d{12}$/.test(form.aadhaar)) {
        toast.error("Aadhaar must be exactly 12 digits");
        return;
      }

      // 🔒 Phone validation
      if (!/^\d{10}$/.test(form.phone)) {
        toast.error("Phone number must be exactly 10 digits");
        return;
      }

      // ADDRESS VALIDATION
      const addr = form.address;
      if (
        !addr.house_and_name ||
        !addr.locality ||
        !addr.city ||
        !addr.district ||
        !addr.state ||
        !addr.pincode
      ) {
        toast.error("Please complete the address details");
        return;
      }

      if (!/^\d{6}$/.test(addr.pincode)) {
        toast.error("Pincode must be exactly 6 digits");
        return;
      }

      // -----------------------------------------
      // MAP ADDRESS TO BACKEND FORMAT
      // -----------------------------------------
      const mappedAddress = {
        house_details: addr.house_and_name,
        street: addr.street,
        locality: addr.locality,
        city: addr.city,
        district: addr.district,
        state: addr.state,
        pincode: addr.pincode,
      };

      const payload = {
        ...form,
        address: mappedAddress,
      };

      await MasterService.createAdmin(payload);

      toast.success("Admin created successfully!");
      navigate("/master/admins");
    } catch (err: any) {
      console.error(err);

      // Clean backend validation feedback
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.response?.data?.message;

      if (msg?.includes("username")) toast.error("Username already exists");
      else if (msg?.includes("email")) toast.error("Email already exists");
      else if (msg?.includes("phone")) toast.error("Phone number already exists");
      else if (msg?.includes("aadhaar")) toast.error("Aadhaar already exists");
      else toast.error(msg || "Failed to create admin");
    }
  };

  // ---------------------------------
  // UI
  // ---------------------------------
  return (
    <>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl font-bold">Create New Admin</h1>

        <Button variant="outline" onClick={() => navigate("/master/admins")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back
        </Button>
      </motion.div>

      {/* FORM CARD */}
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

          {/* Gender */}
          <Select
            onValueChange={(v) => updateForm("gender", v)}
            value={form.gender}
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

          {/* DOB */}
          <Input
            type="date"
            placeholder="Date of Birth *"
            value={form.dob}
            onChange={(e) => updateForm("dob", e.target.value)}
          />

          {/* Aadhaar */}
          <Input
            placeholder="Aadhaar Number *"
            value={form.aadhaar}
            maxLength={12}
            onChange={(e) => updateForm("aadhaar", e.target.value)}
          />
        </div>

        {/* ------------------- CONTACT INFO ------------------- */}
        <h2 className="text-xl font-semibold mt-6 mb-3">Contact Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Phone Number *"
            value={form.phone}
            maxLength={10}
            onChange={(e) => updateForm("phone", e.target.value)}
          />

          <Input
            placeholder="Email Address *"
            value={form.email}
            onChange={(e) => updateForm("email", e.target.value)}
          />

          <Input
            placeholder="Username *"
            value={form.username}
            onChange={(e) => updateForm("username", e.target.value)}
          />
        </div>

        {/* Password */}
        <Input
          type="password"
          placeholder="Password *"
          className="mt-4"
          value={form.password}
          onChange={(e) => updateForm("password", e.target.value)}
        />

        {/* ------------------- ADDRESS ------------------- */}
        <h2 className="text-xl font-semibold mt-6 mb-3">Address</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="House No / Name *"
            value={form.address.house_and_name}
            onChange={(e) => updateAddress("house_and_name", e.target.value)}
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
          <Button size="lg" onClick={handleSubmit}>
            Create Admin
          </Button>
        </div>
      </motion.div>
    </>
  );
}
