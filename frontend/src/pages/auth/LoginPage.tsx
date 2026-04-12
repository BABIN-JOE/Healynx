import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getRoleHomePath } from "../../auth/roleRoutes";
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

  if (!authLoading && user && role) {
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "hospital") {
        const sessionUser = await login("hospital", {
          license_number: form.license_number,
          password: form.password,
        });
        toast.success(
          `Hospital ${sessionUser?.hospital_name || form.license_number} logged in!`
        );
        navigate(getRoleHomePath("hospital"), { replace: true });
      } else {
        const sessionUser = await login("doctor", {
          username: form.username,
          password: form.password,
        });
        toast.success(
          `Doctor ${sessionUser?.name || sessionUser?.username || form.username} logged in!`
        );
        navigate(getRoleHomePath("doctor"), { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="absolute left-6 top-6 z-50">
        <div className="relative">
          <button
            onClick={() => setOpenDropdown((current) => !current)}
            className="flex items-center rounded-md bg-white p-2 shadow hover:bg-slate-100"
          >
            <svg
              className={`h-5 w-5 transform transition-transform ${openDropdown ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openDropdown && (
            <div className="absolute mt-2 w-40 rounded-md border bg-white text-sm shadow">
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

      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border bg-white shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-500 p-10 text-white">
            <div>
              <h1 className="text-4xl font-extrabold">Healynx</h1>
              <p className="mt-2 text-sm opacity-90">
                A secure medical record system with hospital-mediated access.
              </p>

              <div className="mt-10">
                <h2 className="text-xl font-semibold">Welcome back</h2>
                <p className="mt-2 text-sm opacity-90">
                  Login as Hospital or Doctor to continue.
                </p>
              </div>

              <ul className="mt-8 space-y-2 text-sm opacity-95">
                <li>Secure medical records</li>
                <li>Time-limited patient access</li>
                <li>Audit-ready workflow</li>
              </ul>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-6 flex justify-center md:justify-start">
              <div className="flex rounded-full bg-slate-100 p-1">
                <button
                  onClick={() => setActiveTab("hospital")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    activeTab === "hospital" ? "bg-white text-indigo-600 shadow" : "text-slate-600"
                  }`}
                >
                  Hospital
                </button>

                <button
                  onClick={() => setActiveTab("doctor")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    activeTab === "doctor" ? "bg-white text-indigo-600 shadow" : "text-slate-600"
                  }`}
                >
                  Doctor
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {activeTab === "hospital" && (
                <div>
                  <label className="text-xs font-medium text-slate-600">License Number</label>
                  <input
                    required
                    value={form.license_number}
                    onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
              )}

              {activeTab === "doctor" && (
                <div>
                  <label className="text-xs font-medium text-slate-600">Username</label>
                  <input
                    required
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600">Password</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-indigo-600 py-2 text-white transition hover:bg-indigo-700"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 border-t pt-6">
              {activeTab === "hospital" && (
                <>
                  <h3 className="text-sm font-semibold">Register as Hospital</h3>
                  <p className="mt-2 text-xs text-slate-600">Admin approval required.</p>
                  <button
                    onClick={() => navigate("/register/hospital")}
                    className="mt-3 block w-full rounded-lg border py-2 text-center text-sm hover:bg-slate-50"
                  >
                    Hospital Register
                  </button>
                </>
              )}

              {activeTab === "doctor" && (
                <>
                  <h3 className="text-sm font-semibold">Register as Doctor</h3>
                  <p className="mt-2 text-xs text-slate-600">Admin approval required.</p>
                  <button
                    onClick={() => navigate("/register/doctor")}
                    className="mt-3 block w-full rounded-lg border py-2 text-center text-sm hover:bg-slate-50"
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
