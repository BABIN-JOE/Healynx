import React, { useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";

export default function HospitalRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    hospital_name: "",
    license_number: "",
    owner_first_name: "",
    owner_middle_name: "",
    owner_last_name: "",
    owner_aadhaar: "",
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
      pincode: "",
    },
  });

  const Required = () => <span className="text-red-500 font-bold">*</span>;

  const handleAddressChange = (key: string, value: string) => {
    setForm({ ...form, address: { ...form.address, [key]: value } });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const payload = {
        hospital_name: form.hospital_name,
        license_number: form.license_number,

        owner_first_name: form.owner_first_name,
        owner_middle_name: form.owner_middle_name || null,
        owner_last_name: form.owner_last_name,

        owner_aadhaar: form.owner_aadhaar,
        phone: form.phone,
        email: form.email,
        password: form.password,

        address: {
          house_details: form.address.house_details,
          street: form.address.street,
          locality: form.address.locality,
          city: form.address.city,
          district: form.address.district,
          state: form.address.state,
          pincode: form.address.pincode,
        },
      };

      await api.post("/api/v1/hospital/register", payload);
      toast.success("Hospital registration submitted!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8 border">
        <h1 className="text-2xl font-bold text-indigo-600">Hospital Registration</h1>
        <p className="text-sm text-slate-600 mt-1">Admin approval required before login.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* HOSPITAL NAME */}
          <div>
            <label className="text-xs font-semibold">
              Hospital Name <Required />
            </label>
            <input
              required
              className="w-full border rounded px-3 py-2"
              value={form.hospital_name}
              onChange={(e) => setForm({ ...form, hospital_name: e.target.value })}
            />
          </div>

          {/* OWNER DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold">
                Owner First Name <Required />
              </label>
              <input
                required
                className="w-full border rounded px-3 py-2"
                value={form.owner_first_name}
                onChange={(e) => setForm({ ...form, owner_first_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Middle Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.owner_middle_name}
                onChange={(e) => setForm({ ...form, owner_middle_name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">
                Last Name <Required />
              </label>
              <input
                required
                className="w-full border rounded px-3 py-2"
                value={form.owner_last_name}
                onChange={(e) => setForm({ ...form, owner_last_name: e.target.value })}
              />
            </div>
          </div>

          {/* LICENSE + AADHAAR SAME ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold">
                License Number <Required />
              </label>
              <input
                required
                className="w-full border rounded px-3 py-2"
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold">
                Owner Aadhaar <Required />
              </label>
              <input
                required
                maxLength={12}
                className="w-full border rounded px-3 py-2"
                value={form.owner_aadhaar}
                onChange={(e) => setForm({ ...form, owner_aadhaar: e.target.value })}
              />
            </div>
          </div>

          {/* CONTACT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold">
                Phone <Required />
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
                Email <Required />
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

          {/* ADDRESS */}
          <div className="border p-4 rounded-md bg-slate-50">
            <h3 className="font-semibold text-sm mb-2">Address</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.keys(form.address).map((field) => (
                <div key={field}>
                  <label className="text-xs font-medium capitalize">
                    {field.replace("_", " ")}
                    {field !== "street" && <Required />}
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
              Password <Required />
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
