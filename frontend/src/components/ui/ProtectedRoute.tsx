// src/components/ui/ProtectedRoute.tsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: string[];
}) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // 🔹 Wait until authentication check completes
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-600">
        Loading session...
      </div>
    );
  }

  // 🔹 Not authenticated → Redirect to login
  if (!user || !role) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // 🔹 Role not authorized
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // 🔹 Authorized
  return children;
}