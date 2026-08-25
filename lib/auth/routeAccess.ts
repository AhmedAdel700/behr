import { hasAnyPermission } from "@/lib/auth/permissions";
import {
  canUseAdminDashboard,
  canUseEmployeeDashboard,
  type PrimaryRole,
} from "@/lib/auth/roles";
import {
  homePathForRole,
  isAdminRoute,
  isEmployeeRoute,
  type AppRole,
} from "@/lib/auth/routes";

export interface RouteAccessUser {
  appRole: AppRole;
  primaryRole: PrimaryRole;
  permissions: string[];
}

interface RoutePermissionRule {
  match: (pathname: string) => boolean;
  permissions: string[];
}

const ADMIN_ROUTE_RULES: RoutePermissionRule[] = [
  {
    match: (pathname) =>
      pathname === "/admin-dashboard" || pathname === "/admin-dashboard/",
    permissions: ["overview.view"],
  },
  {
    match: (pathname) => pathname.startsWith("/admin-dashboard/employees"),
    permissions: ["employees.view"],
  },
  {
    match: (pathname) => pathname.startsWith("/admin-dashboard/branches"),
    permissions: ["branches.view"],
  },
  {
    match: (pathname) => pathname.startsWith("/admin-dashboard/departments"),
    permissions: ["departments.view"],
  },
  {
    match: (pathname) => pathname.startsWith("/admin-dashboard/leave-types"),
    permissions: ["leave_types.view"],
  },
  {
    match: (pathname) =>
      pathname.startsWith("/admin-dashboard/fingerprint-import"),
    permissions: ["attendance.import"],
  },
  {
    match: (pathname) => pathname.startsWith("/admin-dashboard/registrations"),
    permissions: ["registration_requests.view"],
  },
  {
    match: (pathname) =>
      pathname.startsWith("/admin-dashboard/leave-requests"),
    permissions: ["leave_requests.view"],
  },
  {
    match: (pathname) => pathname.startsWith("/admin-dashboard/positions"),
    permissions: ["job_positions.view"],
  },
  {
    match: (pathname) =>
      pathname.startsWith("/admin-dashboard/system-files"),
    permissions: ["system_files.view"],
  },
];

const EMPLOYEE_ROUTE_RULES: RoutePermissionRule[] = [
  {
    match: (pathname) => pathname === "/",
    permissions: [],
  },
  {
    match: (pathname) => pathname === "/profile",
    permissions: [],
  },
  {
    match: (pathname) => pathname === "/attendance",
    permissions: ["attendance.view", "attendance.check_in", "attendance.check_out"],
  },
  {
    match: (pathname) =>
      pathname === "/requests" || pathname.startsWith("/requests/"),
    permissions: ["requests.view", "requests.create"],
  },
];

const ADMIN_HOME_CANDIDATES = [
  "/admin-dashboard",
  "/admin-dashboard/employees",
  "/admin-dashboard/registrations",
  "/admin-dashboard/leave-requests",
  "/admin-dashboard/branches",
  "/admin-dashboard/departments",
  "/admin-dashboard/leave-types",
  "/admin-dashboard/fingerprint-import",
  "/admin-dashboard/positions",
  "/admin-dashboard/system-files",
] as const;

function findMatchingRule(
  pathname: string,
  rules: readonly RoutePermissionRule[],
): RoutePermissionRule | null {
  return rules.find((rule) => rule.match(pathname)) ?? null;
}

function isEmployeeOnlyUser(user: RouteAccessUser): boolean {
  return user.primaryRole === "employee";
}

export function getAdminRoutePermissions(pathname: string): string[] | null {
  const rule = findMatchingRule(pathname, ADMIN_ROUTE_RULES);
  return rule?.permissions ?? null;
}

export function canAccessAdminPath(
  pathname: string,
  user: RouteAccessUser,
): boolean {
  if (!canUseAdminDashboard(user.primaryRole)) {
    return false;
  }

  const rule = findMatchingRule(pathname, ADMIN_ROUTE_RULES);

  if (!rule) {
    return false;
  }

  return hasAnyPermission(user.permissions, rule.permissions);
}

export function canAccessEmployeePath(
  pathname: string,
  user: RouteAccessUser,
): boolean {
  if (!canUseEmployeeDashboard(user.primaryRole)) {
    return false;
  }

  const rule = findMatchingRule(pathname, EMPLOYEE_ROUTE_RULES);

  if (!rule) {
    return false;
  }

  if (user.primaryRole === "department_manager") {
    return true;
  }

  return hasAnyPermission(user.permissions, rule.permissions);
}

export function canAccessRoute(
  pathname: string,
  user: RouteAccessUser,
): boolean {
  if (isAdminRoute(pathname)) {
    return canAccessAdminPath(pathname, user);
  }

  if (isEmployeeRoute(pathname)) {
    return canAccessEmployeePath(pathname, user);
  }

  return true;
}

export function getPostLoginPath(user: RouteAccessUser): string {
  if (isEmployeeOnlyUser(user)) {
    return "/";
  }

  for (const candidate of ADMIN_HOME_CANDIDATES) {
    if (canAccessAdminPath(candidate, user)) {
      return candidate;
    }
  }

  return "/login";
}

export function getAuthorizedHomePath(
  locale: string,
  user: RouteAccessUser,
): string {
  if (isEmployeeOnlyUser(user)) {
    return homePathForRole(locale, "employee");
  }

  for (const candidate of ADMIN_HOME_CANDIDATES) {
    if (canAccessAdminPath(candidate, user)) {
      return `/${locale}${candidate}`;
    }
  }

  return `/${locale}/login`;
}

export function getAdminNavPermission(pathname: string): string | null {
  const permissions = getAdminRoutePermissions(pathname);
  return permissions?.[0] ?? null;
}
