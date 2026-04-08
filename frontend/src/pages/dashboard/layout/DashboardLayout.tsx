// src/pages/dashboard/layout/DashboardLayout.tsx

import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout({
  links,
}: {
  links: { label: string; to: string; icon?: JSX.Element }[];
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (fixed height) */}
      <Sidebar links={links} />

      {/* Main Content (scrollable only here) */}
      <div className="flex-1 bg-slate-100 p-6 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}