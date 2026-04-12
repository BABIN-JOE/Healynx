import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getRoleHomePath } from "../../auth/roleRoutes";
import { useAuth } from "../../contexts/AuthContext";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { login, user, role, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  if (!authLoading && user && role) {
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionUser = await login("doctor", form);
      toast.success(
        `Doctor ${sessionUser?.name || sessionUser?.username || form.username} logged in!`
      );
      navigate(getRoleHomePath("doctor"), { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
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
            <div className="absolute mt-2 w-44 rounded-md border bg-white text-sm shadow">
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

      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-indigo-600">Doctor Login</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

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

          <button type="submit" disabled={loading} className="w-full rounded-md bg-indigo-600 py-2 text-white">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t pt-5 text-center">
          <p className="mb-2 text-sm text-slate-600">New Doctor? Admin approval required.</p>
          <Link to="/register/doctor" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            Register as Doctor
          </Link>
        </div>
      </div>
    </div>
  );
}
