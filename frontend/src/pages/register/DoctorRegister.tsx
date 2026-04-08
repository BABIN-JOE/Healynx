import React, { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";

export default function DoctorRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    gender: "",
    specialization: "",
    aadhaar: "",
    license_number: "",
    phone: "",
    email: "",
    password: "",
    address: {
      house_details: "",
      street: "",
      locality: "",
      city: "",
      district: "",
      state: "",
      pincode: ""
    }
  });

  const handleAddressChange = (key: string, value: string) => {
    setForm({ ...form, address: { ...form.address, [key]: value } });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      await api.post("/api/v1/doctor/register", form);

      toast.success("Doctor registration submitted successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Registration failed.");
    }
  };

  const Required = ({ children }: any) => (
    <span className="text-red-500 font-bold">{children}</span>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8 border">

        <h1 className="text-2xl font-bold text-indigo-600">Doctor Registration</h1>
        <p className="text-sm text-slate-600 mt-1">Admin approval is required before login.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {/* NAME FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold">
                First Name <Required>*</Required>
              </label>
              <input
                required
                className="w-full border rounded px-3 py-2"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Middle Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.middle_name}
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">
                Last Name <Required>*</Required>
              </label>
              <input
                required
                className="w-full border rounded px-3 py-2"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DOB */}
            <div>
              <label className="block mb-1 font-medium">Date of Birth *</label>
              <input
                type="date"
                className="border p-2 w-full rounded"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block mb-1 font-medium">Gender *</label>
              <select
                className="border p-2 w-full rounded"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AADHAAR */}
            <div>
              <label className="block mb-1 font-medium">Aadhaar Number *</label>
              <input
                required
                maxLength={12}
                className="w-full border rounded px-3 py-2"
                value={form.aadhaar}
                onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
              />
            </div>

            {/* LICENSE */}
            <div>
              <label className="block mb-1 font-medium">License Number *</label>
              <input
                required
                className="w-full border rounded px-3 py-2"
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              />
            </div>
          </div>

          {/* PHONE & EMAIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">
                Phone <Required>*</Required>
              </label>
              <input
                required
                maxLength={10}
                className="w-full border rounded px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">
                Email <Required>*</Required>
              </label>
              <input
                required
                type="email"
                className="w-full border rounded px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* SPECIALIZATION */}
            <div>
              <label className="block mb-1 font-medium">Specialization *</label>
              <input
                required
                className="w-full border rounded px-3 py-2"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
            </div>

          {/* ADDRESS */}
          <div className="border p-4 rounded-md bg-slate-50">
            <h3 className="font-semibold text-sm mb-2">Address</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.keys(form.address).map((field) => (
                <div key={field}>
                  <label className="text-xs font-medium capitalize">
                    {field.replace("_", " ")}{" "}
                    {field !== "street" && <Required>*</Required>}
                  </label>
                  <input
                    required={field !== "street"}
                    className="w-full border rounded px-3 py-2"
                    value={(form.address as any)[field]}
                    onChange={(e) => handleAddressChange(field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-xs font-semibold">
              Password <Required>*</Required>
            </label>
            <input
              required
              type="password"
              className="w-full border rounded px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            Submit Registration
          </button>

          <Link to="/" className="text-sm text-indigo-600 text-center block mt-4">
            ← Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
