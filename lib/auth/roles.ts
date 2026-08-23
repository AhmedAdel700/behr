import type { AdminRole } from "@/types/AdminApiTypes";
import type { AppRole } from "@/lib/auth/routes";

export type PrimaryRole = "super_admin" | "department_manager" | "employee";

function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, "_");
}

function isSuperAdminRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === "super_admin" || normalized === "superadmin";
}

function isDepartmentManagerRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return (
    normalized === "department_manager" ||
    normalized === "departmentmanager" ||
    normalized.includes("department_manager")
  );
}

export function resolvePrimaryRole(
  roles: readonly string[] | undefined,
): PrimaryRole {
  const normalized = (roles ?? []).map(normalizeRole);

  if (normalized.some(isSuperAdminRole) || (roles ?? []).some(isSuperAdminRole)) {
    return "super_admin";
  }

  if (
    normalized.some(isDepartmentManagerRole) ||
    (roles ?? []).some(isDepartmentManagerRole)
  ) {
    return "department_manager";
  }

  return "employee";
}

export function resolveAppRole(roles: readonly string[] | undefined): AppRole {
  const primaryRole = resolvePrimaryRole(roles);
  return primaryRole === "employee" ? "employee" : "admin";
}

export function resolveAdminRole(
  roles: readonly string[] | undefined,
): AdminRole {
  const primaryRole = resolvePrimaryRole(roles);
  return primaryRole === "super_admin" ? "super_admin" : "department_manager";
}

export function isAdminPrimaryRole(role: PrimaryRole): boolean {
  return role === "super_admin" || role === "department_manager";
}
