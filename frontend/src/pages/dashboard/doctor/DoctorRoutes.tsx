// src/pages/dashboard/doctor/DoctorRoutes.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";

import DoctorDashboard from "./DoctorDashboard";
import DoctorJoinHospital from "./DoctorHospital";
import DoctorPatientAccess from "./DoctorPatientAccess";
import DoctorMedicalEntries from "./DoctorMedicalEntries";
import DoctorPatientRecords from "./DoctorPatientRecords";
import DoctorSettings from "./DoctorSettings";
import apiClient from "../../../api/apiClient";

import { Home, FolderLock, FileText, Building2, Settings } from "lucide-react";

export default function DoctorRoutes() {
  const [hospitalStatus, setHospitalStatus] = useState<{
    mapped: boolean;
    hospital?: any;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHospitalStatus();
  }, []);

  const checkHospitalStatus = async () => {
    try {
      const { data } = await apiClient.get("/api/v1/doctor/my-hospital");
      setHospitalStatus(data);
    } catch (err) {
      console.error("Hospital status check error:", err);
      setHospitalStatus({ mapped: false });
    } finally {
      setLoading(false);
    }
  };

  // Component to protect routes that require hospital membership
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return <div className="p-6 text-center">Loading...</div>;
    }

    if (!hospitalStatus?.mapped) {
      return (
        <div className="p-6">
          <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Access Restricted</h2>
            <p className="text-red-700 mb-4">
              You must be a member of a hospital to access this feature.
            </p>
            <p className="text-sm text-red-600">
              Please visit the <strong>Hospital</strong> tab to join a hospital first.
            </p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  const doctorLinks = [
    {
      label: "Dashboard",
      to: "/doctor",
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: "Hospital",
      to: "/doctor/join-hospital",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: "Patient Access",
      to: "/doctor/patient-access",
      icon: <FolderLock className="h-5 w-5" />,
      disabled: !hospitalStatus?.mapped,
    },
    {
      label: "Medical Entries",
      to: "/doctor/medical-entries",
      icon: <FileText className="h-5 w-5" />,
      disabled: !hospitalStatus?.mapped,
    },
    {
      label: "Settings",
      to: "/doctor/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <Routes>
      <Route element={<DashboardLayout links={doctorLinks} />}>
        {/* /doctor */}
        <Route index element={<DoctorDashboard />} />

        {/* /doctor/join-hospital */}
        <Route path="join-hospital" element={<DoctorJoinHospital />} />

        {/* /doctor/patient-access */}
        <Route path="patient-access" element={
          <ProtectedRoute>
            <DoctorPatientAccess />
          </ProtectedRoute>
        } />

        {/* /doctor/medical-entries */}
        <Route path="medical-entries" element={
          <ProtectedRoute>
            <DoctorMedicalEntries />
          </ProtectedRoute>
        } />

        <Route path="patient-records/:patientId" element={
          <ProtectedRoute>
            <DoctorPatientRecords />
          </ProtectedRoute>
        } />

        {/* /doctor/settings */}
        <Route path="settings" element={<DoctorSettings />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Route>
    </Routes>
  );
}
