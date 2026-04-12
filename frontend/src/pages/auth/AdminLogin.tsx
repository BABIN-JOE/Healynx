import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { getRoleHomePath } from "../../auth/roleRoutes";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user, role, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (!authLoading && user && role) {
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionUser = await login("admin", form);
      toast.success(
        `Admin ${sessionUser?.name || sessionUser?.username || form.username} logged in successfully!`
      );
      navigate(getRoleHomePath("admin"), { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-indigo-600">Admin Login</h1>

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

          <Link to="/" className="mt-3 block text-center text-sm text-indigo-600">
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
