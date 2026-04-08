import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="w-full bg-white shadow px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-indigo-600 font-bold text-lg">Healynx</div>
        <nav className="text-sm text-slate-600">
          <span className="mr-4">Dashboard</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="text-sm text-slate-700">
              {user?.role?.toUpperCase() || "USER"} • {user?.username || user?.name || ""}
            </div>
            <button
              onClick={() => logout()}
              className="text-sm bg-slate-100 px-3 py-1 rounded-md"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="text-sm text-slate-500">Not signed in</div>
        )}
      </div>
    </header>
  );
}
