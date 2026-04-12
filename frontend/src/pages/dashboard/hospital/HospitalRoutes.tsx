// src/pages/dashboard/hospital/HospitalRoutes.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

import HospitalDashboard from "./HospitalDashboard";
import HospitalDoctors from "./HospitalDoctors";
import HospitalDoctorView from "./HospitalDoctorView";
import DoctorJoinRequests from "./DoctorJoinRequests";
import DoctorJoinRequestView from "./DoctorJoinRequestView";
import PatientAccessRequests from "./PatientAccessRequests";
import PendingEntries from "./PendingEntries";
import PendingProfileUpdates from "./PendingProfileUpdates";
import HospitalSettings from "./HospitalSettings";

import { Home, Users, UserPlus, FolderLock, FileClock, Settings } from "lucide-react";

const hospitalLinks = [
  { label: "Dashboard", to: "/hospital", icon: <Home className="h-5 w-5" /> },
  { label: "Doctors", to: "/hospital/doctors", icon: <Users className="h-5 w-5" /> },
  { label: "Doctor Join Requests", to: "/hospital/doctor-join-requests", icon: <UserPlus className="h-5 w-5" /> },
  { label: "Patient Access", to: "/hospital/patient-access", icon: <FolderLock className="h-5 w-5" /> },
  { label: "Pending Entries", to: "/hospital/pending-entries", icon: <FileClock className="h-5 w-5" /> },
  { label: "Profile Updates", to: "/hospital/profile-updates", icon: <FileClock className="h-5 w-5" /> },
  { label: "Settings", to: "/hospital/settings", icon: <Settings className="h-5 w-5" /> },
];

export default function HospitalRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout links={hospitalLinks} />}>
        <Route index element={<HospitalDashboard />} />

        <Route path="doctors" element={<HospitalDoctors />} />
        <Route path="doctors/:doctorId" element={<HospitalDoctorView />} />

        <Route path="doctor-join-requests" element={<DoctorJoinRequests />} />
        <Route path="doctor-join-requests/:reqId" element={<DoctorJoinRequestView />} />

        <Route path="patient-access" element={<PatientAccessRequests />} />
        <Route path="pending-entries" element={<PendingEntries />} />

        <Route path="profile-updates" element={<PendingProfileUpdates />} />

        <Route path="*" element={<Navigate to="/hospital" replace />} />
      </Route>
    </Routes>
  );
}
