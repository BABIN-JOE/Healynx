// src/pages/dashboard/master/MasterRoutes.tsx
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

// Pages
import MasterDashboard from "./MasterDashboard";
import AdminList from "./AdminList";
import AdminCreate from "./AdminCreate";
import AdminEdit from "./AdminEdit";
import AdminView from "./AdminView";

export default function MasterRoutes() {
  const links = [
    { label: "Home", to: "/master" },
    { label: "Admins", to: "/master/admins" },
    { label: "Settings", to: "/master/settings" },
  ];

  return (
    <Routes>
      <Route element={<DashboardLayout links={links} />}>

        {/* HOME / DASHBOARD */}
        <Route index element={<MasterDashboard />} />

        {/* ADMIN CRUD */}
        <Route path="admins" element={<AdminList />} />
        <Route path="admins/create" element={<AdminCreate />} />
        <Route path="admins/:id/edit" element={<AdminEdit />} />
        <Route path="admins/:id/view" element={<AdminView />} />

      </Route>
    </Routes>
  );
}
