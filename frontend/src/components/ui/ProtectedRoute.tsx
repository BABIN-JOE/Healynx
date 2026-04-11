import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { getRoleHomePath } from "../../auth/roleRoutes";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles: string[];
}) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-600">
        Loading session...
      </div>
    );
  }

  if (!user || !role) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  return children;
}
