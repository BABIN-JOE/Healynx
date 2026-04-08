// src/pages/dashboard/doctor/DoctorRoutes.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

import DoctorDashboard from "./DoctorDashboard";
import DoctorJoinHospital from "./DoctorHospital";
import DoctorPatientAccess from "./DoctorPatientAccess";
import DoctorMedicalEntries from "./DoctorMedicalEntries";
import DoctorPatientRecords from "./DoctorPatientRecords";

import { Home, FolderLock, FileText, Building2 } from "lucide-react";

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
  },
  {
    label: "Medical Entries",
    to: "/doctor/medical-entries",
    icon: <FileText className="h-5 w-5" />,
  },
];

export default function DoctorRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout links={doctorLinks} />}>
        {/* /doctor */}
        <Route index element={<DoctorDashboard />} />

        {/* /doctor/join-hospital */}
        <Route path="join-hospital" element={<DoctorJoinHospital />} />

        {/* /doctor/patient-access */}
        <Route path="patient-access" element={<DoctorPatientAccess />} />

        {/* /doctor/medical-entries */}
        <Route path="medical-entries" element={<DoctorMedicalEntries />} />

        <Route path="patient-records/:patientId" element={<DoctorPatientRecords />}/>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Route>
    </Routes>
  );
}
