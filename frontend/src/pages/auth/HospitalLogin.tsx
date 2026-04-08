import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export default function HospitalLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ license_number: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [openApprovalDropdown, setOpenApprovalDropdown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login("hospital", form);
      setTimeout(() => {
        toast.success("Hospital logged in!");
        navigate("/dashboard/hospital", { replace: true });
    }, 50);

    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-100 to-slate-200 relative">

      {/* MASTER/ADMIN DROPDOWN */}
      <div className="absolute top-6 left-6 z-50">
        <div className="relative">
          <button
            onClick={() => setOpenApprovalDropdown((s) => !s)}
            className="flex items-center bg-white shadow p-2 rounded-md hover:bg-slate-100"
          >
            <svg
              className={`h-5 w-5 transform transition-transform ${
                openApprovalDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openApprovalDropdown && (
            <div className="absolute mt-2 bg-white border shadow rounded-md w-44 text-sm">
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

      <div className="w-full max-w-md bg-white shadow rounded-xl p-6">
        <h1 className="text-2xl font-bold text-indigo-600">Hospital Login</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">License Number</label>
            <input
              required
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white w-full py-2 rounded-md"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t pt-5 text-center">
          <p className="text-sm text-slate-600 mb-2">New Hospital? Admin approval required.</p>
          <Link to="/register/hospital" className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">
            Register as Hospital
          </Link>
        </div>
      </div>
    </div>
  );
}
