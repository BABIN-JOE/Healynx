// frontend/src/pages/auth/LoginPage.tsx

import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, role, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"hospital" | "doctor">("hospital");
  const [openDropdown, setOpenDropdown] = useState(false);

  const [form, setForm] = useState({
    license_number: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // 🔥 Redirect if already logged in
  if (!authLoading && user && role) {
    return <Navigate to={`/${role}`} replace />;
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "hospital") {
        await login("hospital", {
          license_number: form.license_number,
          password: form.password,
        });
        toast.success("Hospital logged in!");
        navigate("/hospital", { replace: true });
      } else {
        await login("doctor", {
          username: form.username,
          password: form.password,
        });
        toast.success("Doctor logged in!");
        navigate("/doctor", { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4 relative">

      {/* MASTER + ADMIN DROPDOWN */}
      <div className="absolute top-6 left-6 z-50">
        <div className="relative">
          <button
            onClick={() => setOpenDropdown((s) => !s)}
            className="flex items-center bg-white shadow p-2 rounded-md hover:bg-slate-100"
          >
            <svg
              className={`h-5 w-5 transform transition-transform ${
                openDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDropdown && (
            <div className="absolute mt-2 bg-white border shadow rounded-md w-40 text-sm">
              <Link to="/master-login" className="block px-3 py-2 hover:bg-slate-100">
                Master Login
              </Link>
              <Link to="/admin-login" className="block px-3 py-2 hover:bg-slate-100">
                Admin Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden border">
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* LEFT PANEL */}
          <div className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-500 text-white flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-extrabold">Healynx</h1>
              <p className="mt-2 opacity-90 text-sm">
                A secure medical record system with hospital-mediated access.
              </p>

              <div className="mt-10">
                <h2 className="text-xl font-semibold">Welcome back</h2>
                <p className="text-sm opacity-90 mt-2">
                  Login as Hospital or Doctor to continue.
                </p>
              </div>

              <ul className="mt-8 space-y-2 text-sm opacity-95">
                <li>✔ 100% encrypted medical records</li>
                <li>✔ Time-limited patient access</li>
                <li>✔ Secure audit logging</li>
              </ul>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="p-8">

            {/* TABS */}
            <div className="flex justify-center md:justify-start mb-6">
              <div className="flex rounded-full bg-slate-100 p-1">
                <button
                  onClick={() => setActiveTab("hospital")}
                  className={`px-4 py-2 rounded-full text-sm ${
                    activeTab === "hospital"
                      ? "bg-white shadow text-indigo-600"
                      : "text-slate-600"
                  }`}
                >
                  Hospital
                </button>

                <button
                  onClick={() => setActiveTab("doctor")}
                  className={`px-4 py-2 rounded-full text-sm ${
                    activeTab === "doctor"
                      ? "bg-white shadow text-indigo-600"
                      : "text-slate-600"
                  }`}
                >
                  Doctor
                </button>
              </div>
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">

              {/* Hospital login */}
              {activeTab === "hospital" && (
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    License Number
                  </label>
                  <input
                    required
                    value={form.license_number}
                    onChange={(e) =>
                      setForm({ ...form, license_number: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}

              {/* Doctor login */}
              {activeTab === "doctor" && (
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Username
                  </label>
                  <input
                    required
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Password
                </label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* REGISTER LINKS */}
            <div className="mt-8 border-t pt-6">
              {activeTab === "hospital" && (
                <>
                  <h3 className="text-sm font-semibold">Register as Hospital</h3>
                  <p className="text-xs text-slate-600 mt-2">
                    Admin approval required.
                  </p>
                  <button
                    onClick={() => navigate("/register/hospital")}
                    className="mt-3 block w-full text-center py-2 border rounded-lg text-sm hover:bg-slate-50"
                  >
                    Hospital Register
                  </button>
                </>
              )}

              {activeTab === "doctor" && (
                <>
                  <h3 className="text-sm font-semibold">Register as Doctor</h3>
                  <p className="text-xs text-slate-600 mt-2">
                    Admin approval required.
                  </p>
                  <button
                    onClick={() => navigate("/register/doctor")}
                    className="mt-3 block w-full text-center py-2 border rounded-lg text-sm hover:bg-slate-50"
                  >
                    Doctor Register
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
