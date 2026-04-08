// src/components/ui/ProtectedRoute.tsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: string[];
}) {
  const { user, role, loading } = useAuth();

  // 🔹 1. Wait until auth check completes
  if (loading) {
    return (
      <div className="p-6 w-full text-center text-slate-600">
        Loading session...
      </div>
    );
  }

  // 🔹 2. Not authenticated → go to login
  if (!user || !role) {
    return <Navigate to="/" replace />;
  }

  // 🔹 3. Role not allowed → also redirect
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // 🔹 4. Authorized
  return children;
}