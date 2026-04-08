import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "./contexts/AuthContext";

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

function RedirectByRole({ role }: { role: string | null }) {
  if (!role) return <Navigate to="/" replace />;

  if (role === "master") return <Navigate to="/master" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "hospital") return <Navigate to="/hospital" replace />;
  if (role === "doctor") return <Navigate to="/doctor" replace />;

  return <Navigate to="/" replace />;
}

export default function App() {
  const { role } = useAuth();

  return (
    <>
      <Toaster richColors position="top-center" />

      <Routes>
        {/* LOGIN */}
        <Route
          path="/"
          element={role ? <RedirectByRole role={role} /> : <LoginPage />}
        />

        <Route path="/master-login" element={<MasterLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/hospital-login" element={<HospitalLogin />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />

        {/* REGISTER */}
        <Route path="/register/hospital" element={<HospitalRegister />} />
        <Route path="/register/doctor" element={<DoctorRegister />} />

        {/* DASHBOARDS */}
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

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}