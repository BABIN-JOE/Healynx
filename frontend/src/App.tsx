import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { getRoleHomePath } from "./auth/roleRoutes";

import ProtectedRoute from "./components/ui/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import MasterLogin from "./pages/auth/MasterLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import HospitalLogin from "./pages/auth/HospitalLogin";
import DoctorLogin from "./pages/auth/DoctorLogin";

import HospitalRegister from "./pages/register/HospitalRegister";
import DoctorRegister from "./pages/register/DoctorRegister";

import MasterRoutes from "./pages/dashboard/master/MasterRoutes";
import AdminRoutes from "./pages/dashboard/admin/AdminRoutes";
import HospitalRoutes from "./pages/dashboard/hospital/HospitalRoutes";
import DoctorRoutes from "./pages/dashboard/doctor/DoctorRoutes";

import { Toaster } from "sonner";

function RedirectByRole({ role }: { role: string | null }) {
  if (!role) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getRoleHomePath(role)} replace />;
}

function SessionLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-600">
      Loading session...
    </div>
  );
}

export default function App() {
  const { role, loading } = useAuth();

  return (
    <>
      <Routes>
      <Route
        path="/"
        element={
          loading ? (
            <SessionLoadingScreen />
          ) : role ? (
            <RedirectByRole role={role} />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route path="/master-login" element={<MasterLogin />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/hospital-login" element={<HospitalLogin />} />
      <Route path="/doctor-login" element={<DoctorLogin />} />

      <Route path="/register/hospital" element={<HospitalRegister />} />
      <Route path="/register/doctor" element={<DoctorRegister />} />

      <Route
        path="/master/*"
        element={
          <ProtectedRoute allowedRoles={["master"]}>
            <MasterRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hospital/*"
        element={
          <ProtectedRoute allowedRoles={["hospital"]}>
            <HospitalRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorRoutes />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster />
    </>
  );
}
