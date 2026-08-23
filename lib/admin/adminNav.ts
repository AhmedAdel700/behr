import {
  Building2,
  CalendarDays,
  ClipboardList,
  Fingerprint,
  LayoutDashboard,
  MapPinned,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";

export interface AdminNavItem {
  href: string;
  key:
    | "overview"
    | "employees"
    | "registrations"
    | "leaveTypes"
    | "leaveRequests"
    | "branches"
    | "departments"
    | "fingerprintImport"
    | "positions";
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  requiredPermission: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin-dashboard",
    key: "overview",
    icon: LayoutDashboard,
    match: (pathname) =>
      pathname === "/admin-dashboard" || pathname === "/admin-dashboard/",
    requiredPermission: "overview.view",
  },
  {
    href: "/admin-dashboard/employees",
    key: "employees",
    icon: Users,
    match: (pathname) => pathname.startsWith("/admin-dashboard/employees"),
    requiredPermission: "employees.view",
  },
  {
    href: "/admin-dashboard/branches",
    key: "branches",
    icon: MapPinned,
    match: (pathname) => pathname.startsWith("/admin-dashboard/branches"),
    requiredPermission: "branches.view",
  },
  {
    href: "/admin-dashboard/departments",
    key: "departments",
    icon: Building2,
    match: (pathname) => pathname.startsWith("/admin-dashboard/departments"),
    requiredPermission: "departments.view",
  },
  {
    href: "/admin-dashboard/leave-types",
    key: "leaveTypes",
    icon: ClipboardList,
    match: (pathname) => pathname.startsWith("/admin-dashboard/leave-types"),
    requiredPermission: "leave_types.view",
  },
  {
    href: "/admin-dashboard/fingerprint-import",
    key: "fingerprintImport",
    icon: Fingerprint,
    match: (pathname) =>
      pathname.startsWith("/admin-dashboard/fingerprint-import"),
    requiredPermission: "attendance.import",
  },
  {
    href: "/admin-dashboard/registrations",
    key: "registrations",
    icon: UserPlus,
    match: (pathname) => pathname.startsWith("/admin-dashboard/registrations"),
    requiredPermission: "registration_requests.view",
  },
  {
    href: "/admin-dashboard/leave-requests",
    key: "leaveRequests",
    icon: CalendarDays,
    match: (pathname) => pathname.startsWith("/admin-dashboard/leave-requests"),
    requiredPermission: "leave_requests.view",
  },
  {
    href: "/admin-dashboard/positions",
    key: "positions",
    icon: ClipboardList,
    match: (pathname) => pathname.startsWith("/admin-dashboard/positions"),
    requiredPermission: "job_positions.view",
  },
];

export function getAdminNavItems(
  permissions: readonly string[],
): AdminNavItem[] {
  return ADMIN_NAV_ITEMS.filter((item) =>
    hasPermission(permissions, item.requiredPermission),
  );
}

export function getAdminPageTitleKey(pathname: string): AdminNavItem["key"] {
  const item = ADMIN_NAV_ITEMS.find((nav) => nav.match(pathname));
  return item?.key ?? "overview";
}

export function isRestrictedAdminRoute(pathname: string): boolean {
  return ADMIN_NAV_ITEMS.some((item) => item.match(pathname));
}

export function getRequiredAdminPermission(pathname: string): string | null {
  const item = ADMIN_NAV_ITEMS.find((nav) => nav.match(pathname));
  return item?.requiredPermission ?? null;
}

export const ADMIN_DEFAULT_REDIRECT_PATH = "/admin-dashboard";
