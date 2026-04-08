// src/pages/dashboard/layout/Sidebar.tsx

import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

interface SidebarProps {
  links: { label: string; to: string; icon?: JSX.Element }[];
}

export default function Sidebar({ links }: SidebarProps) {
  const { logout } = useAuth();
  const location = useLocation();

  // Detect if link is a root dashboard route
  const isRootRoute = (path: string) => {
    return (
      path === "/master" ||
      path === "/admin" ||
      path === "/doctor" ||
      path === "/hospital"
    );
  };

  return (
    <div className="w-64 bg-indigo-700 text-white flex flex-col h-full">
      {/* LOGO */}
      <div className="p-6 text-2xl font-bold border-b border-indigo-600">
        Healynx
      </div>

      {/* LINKS */}
      <div className="flex-1 overflow-y-auto mt-4">
        {links.map((item) => {
          const exact = isRootRoute(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={exact} // 🔥 THIS FIXES EVERYTHING
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm transition-all
                ${
                  isActive
                    ? "bg-indigo-900 font-semibold"
                    : "hover:bg-indigo-800"
                }`
              }
            >
              {item.icon && <span className="h-5 w-5">{item.icon}</span>}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="m-4 mb-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
      >
        Logout
      </button>
    </div>
  );
}