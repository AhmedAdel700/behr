import {
  Building2,
  CalendarDays,
  ClipboardList,
  Fingerprint,
  LayoutDashboard,
  MapPinned,
  Settings,
  UserPlus,
  Users,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";
import type { AdminRole } from "@/types/AdminApiTypes";

export type AdminNavItemKey =
  | "employeeDashboard"
  | "overview"
  | "employees"
  | "registrations"
  | "leaveTypes"
  | "leaveRequests"
  | "branches"
  | "departments"
  | "fingerprintImport"
  | "positions";

export type AdminNavSubItemKey = "systemFiles";

export type AdminNavGroupKey = "system";

export type AdminNavTitleKey = AdminNavItemKey | AdminNavSubItemKey;

export interface AdminNavItem {
  kind: "item";
  href: string;
  key: AdminNavItemKey;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  requiredPermission: string;
  requiredRole?: AdminRole;
}

export interface AdminNavSubItem {
  href: string;
  key: AdminNavSubItemKey;
  match: (pathname: string) => boolean;
  requiredPermission: string;
  requiredRole?: AdminRole;
}

export interface AdminNavGroup {
  kind: "group";
  key: AdminNavGroupKey;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  requiredPermission: string;
  requiredRole?: AdminRole;
  children: AdminNavSubItem[];
}

export type AdminNavEntry = AdminNavItem | AdminNavGroup;

export function isAdminNavGroup(entry: AdminNavEntry): entry is AdminNavGroup {
  return entry.kind === "group";
}

const EMPLOYEE_DASHBOARD_NAV_ITEM: AdminNavItem = {
  kind: "item",
  href: "/",
  key: "employeeDashboard",
  icon: UserRound,
  match: () => false,
  requiredPermission: "overview.view",
  requiredRole: "department_manager",
};

export const ADMIN_NAV_ENTRIES: AdminNavEntry[] = [
  {
    kind: "item",
    href: "/admin-dashboard",
    key: "overview",
    icon: LayoutDashboard,
    match: (pathname) =>
      pathname === "/admin-dashboard" || pathname === "/admin-dashboard/",
    requiredPermission: "overview.view",
  },
  {
    kind: "item",
    href: "/admin-dashboard/employees",
    key: "employees",
    icon: Users,
    match: (pathname) => pathname.startsWith("/admin-dashboard/employees"),
    requiredPermission: "employees.view",
  },
  {
    kind: "item",
    href: "/admin-dashboard/branches",
    key: "branches",
    icon: MapPinned,
    match: (pathname) => pathname.startsWith("/admin-dashboard/branches"),
    requiredPermission: "branches.view",
  },
  {
    kind: "item",
    href: "/admin-dashboard/departments",
    key: "departments",
    icon: Building2,
    match: (pathname) => pathname.startsWith("/admin-dashboard/departments"),
    requiredPermission: "departments.view",
  },
  {
    kind: "item",
    href: "/admin-dashboard/leave-types",
    key: "leaveTypes",
    icon: ClipboardList,
    match: (pathname) => pathname.startsWith("/admin-dashboard/leave-types"),
    requiredPermission: "leave_types.view",
    requiredRole: "super_admin",
  },
  {
    kind: "item",
    href: "/admin-dashboard/fingerprint-import",
    key: "fingerprintImport",
    icon: Fingerprint,
    match: (pathname) =>
      pathname.startsWith("/admin-dashboard/fingerprint-import"),
    requiredPermission: "attendance.import",
  },
  {
    kind: "item",
    href: "/admin-dashboard/registrations",
    key: "registrations",
    icon: UserPlus,
    match: (pathname) => pathname.startsWith("/admin-dashboard/registrations"),
    requiredPermission: "registration_requests.view",
  },
  {
    kind: "item",
    href: "/admin-dashboard/leave-requests",
    key: "leaveRequests",
    icon: CalendarDays,
    match: (pathname) => pathname.startsWith("/admin-dashboard/leave-requests"),
    requiredPermission: "leave_requests.view",
  },
  {
    kind: "item",
    href: "/admin-dashboard/positions",
    key: "positions",
    icon: ClipboardList,
    match: (pathname) => pathname.startsWith("/admin-dashboard/positions"),
    requiredPermission: "job_positions.view",
  },
  {
    kind: "group",
    key: "system",
    icon: Settings,
    match: (pathname) => pathname.startsWith("/admin-dashboard/system"),
    requiredPermission: "system_files.view",
    children: [
      {
        href: "/admin-dashboard/system-files",
        key: "systemFiles",
        match: (pathname) =>
          pathname.startsWith("/admin-dashboard/system-files"),
        requiredPermission: "system_files.view",
      },
    ],
  },
];

function findMatchingSubItem(pathname: string): AdminNavSubItem | null {
  for (const entry of ADMIN_NAV_ENTRIES) {
    if (!isAdminNavGroup(entry)) {
      continue;
    }

    const child = entry.children.find((item) => item.match(pathname));
    if (child) {
      return child;
    }
  }

  return null;
}

function findMatchingItem(pathname: string): AdminNavItem | null {
  for (const entry of ADMIN_NAV_ENTRIES) {
    if (isAdminNavGroup(entry)) {
      continue;
    }

    if (entry.match(pathname)) {
      return entry;
    }
  }

  return null;
}

function matchesRequiredRole(
  requiredRole: AdminRole | undefined,
  role: AdminRole,
): boolean {
  return !requiredRole || requiredRole === role;
}

function filterNavEntry(
  entry: AdminNavEntry,
  permissions: readonly string[],
  role: AdminRole,
): AdminNavEntry | null {
  if (!matchesRequiredRole(entry.requiredRole, role)) {
    return null;
  }

  if (isAdminNavGroup(entry)) {
    const children = entry.children.filter(
      (child) =>
        matchesRequiredRole(child.requiredRole, role) &&
        hasPermission(permissions, child.requiredPermission),
    );

    if (children.length === 0) {
      return null;
    }

    if (!hasPermission(permissions, entry.requiredPermission)) {
      return null;
    }

    return { ...entry, children };
  }

  return hasPermission(permissions, entry.requiredPermission) ? entry : null;
}

export function getAdminNavEntries(
  permissions: readonly string[],
  role: AdminRole,
): AdminNavEntry[] {
  const entries = ADMIN_NAV_ENTRIES.flatMap((entry) => {
    const filtered = filterNavEntry(entry, permissions, role);
    return filtered ? [filtered] : [];
  });

  if (role !== "department_manager") {
    return entries;
  }

  return [EMPLOYEE_DASHBOARD_NAV_ITEM, ...entries];
}

/** @deprecated Use getAdminNavEntries. Kept for badge keys on top-level items. */
export function getAdminNavItems(
  permissions: readonly string[],
  role: AdminRole,
): AdminNavItem[] {
  return getAdminNavEntries(permissions, role).flatMap((entry) =>
    isAdminNavGroup(entry) ? [] : [entry],
  );
}

export function getAdminPageTitleKey(pathname: string): AdminNavTitleKey {
  const subItem = findMatchingSubItem(pathname);
  if (subItem) {
    return subItem.key;
  }

  const item = findMatchingItem(pathname);
  return item?.key ?? "overview";
}

export function isRestrictedAdminRoute(pathname: string): boolean {
  return (
    findMatchingItem(pathname) !== null || findMatchingSubItem(pathname) !== null
  );
}

export function getRequiredAdminPermission(pathname: string): string | null {
  const subItem = findMatchingSubItem(pathname);
  if (subItem) {
    return subItem.requiredPermission;
  }

  const item = findMatchingItem(pathname);
  return item?.requiredPermission ?? null;
}

export const ADMIN_DEFAULT_REDIRECT_PATH = "/admin-dashboard";
