// src/pages/dashboard/admin/AdminRoutes.tsx

import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

import AdminDashboard from "./AdminDashboard";

// Hospital
import HospitalMain from "./Hospitals";
import HospitalView from "./HospitalView";
import HospitalRequests from "./HospitalRequests";
import HospitalRequestView from "./HospitalRequestView";
import HospitalEdit from "./HospitalEdit";

// Doctor
import Doctors from "./Doctors";
import DoctorView from "./DoctorView";
import DoctorRequests from "./DoctorRequests";
import DoctorRequestView from "./DoctorRequestView";
import DoctorEdit from "./DoctorEdit";

// Patients
import PatientList from "./PatientList";
import PatientCreate from "./PatientCreate";
import PatientEdit from "./PatientEdit";
import PatientView from "./PatientView";

import { LayoutDashboard, Hospital, User, Users } from "lucide-react";

export default function AdminRoutes() {
  const adminLinks = [
    { label: "Dashboard", to: "/admin", icon: <LayoutDashboard /> },
    { label: "Hospitals", to: "/admin/hospitals", icon: <Hospital /> },
    { label: "Doctors", to: "/admin/doctors", icon: <User /> },
    { label: "Patients", to: "/admin/patients", icon: <Users /> },
  ];

  return (
    <Routes>
      <Route element={<DashboardLayout links={adminLinks} />}>
        <Route index element={<AdminDashboard />} />

        {/* HOSPITALS */}
        <Route path="hospitals" element={<HospitalMain />} />
        <Route path="hospitals/blocked" element={<HospitalMain showBlockedOverride={true} />} />
        <Route path="hospitals/:hospitalId/view" element={<HospitalView />} />
        <Route path="hospitals/:hospitalId/edit" element={<HospitalEdit />} />

        {/* HOSPITAL REQUESTS */}
        <Route path="hospital-requests" element={<HospitalRequests />} />
        <Route path="hospital-requests/:id/view" element={<HospitalRequestView />} />

        {/* DOCTOR REQUESTS */}
        <Route path="doctor-requests" element={<DoctorRequests />} />
        <Route path="doctor-requests/:id/view" element={<DoctorRequestView />} />

        {/* DOCTORS */}
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctors/:doctorId/view" element={<DoctorView />} />
        <Route path="doctors/:doctorId/edit" element={<DoctorEdit />} />

        {/* PATIENTS */}
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/create" element={<PatientCreate />} />
        <Route path="patients/:patientId/edit" element={<PatientEdit />} />
        <Route path="patients/:patientId/view" element={<PatientView />} />
      </Route>
    </Routes>
  );
}
