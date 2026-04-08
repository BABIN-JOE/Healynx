import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export default function MasterLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This will call backend and AuthContext will read /auth/me
      await login("master", form);

      toast.success("Master logged in!");
      navigate("/master", { replace: true });

    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-indigo-600">Master Login</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
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

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <Link to="/" className="text-sm text-indigo-600 text-center block mt-3">
            ← Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}
