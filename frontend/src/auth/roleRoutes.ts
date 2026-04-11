export type UserRole = "master" | "admin" | "hospital" | "doctor";

const ROLE_HOME_PATHS: Record<UserRole, string> = {
  master: "/master",
  admin: "/admin",
  hospital: "/hospital",
  doctor: "/doctor",
};

export function isUserRole(role: string | null | undefined): role is UserRole {
  return role === "master" || role === "admin" || role === "hospital" || role === "doctor";
}

export function getRoleHomePath(role: string | null | undefined): string {
  if (!isUserRole(role)) {
    return "/";
  }

  return ROLE_HOME_PATHS[role];
}
