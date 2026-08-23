import {
  resolveAdminRole,
  resolveAppRole,
  resolvePrimaryRole,
  type PrimaryRole,
} from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/routes";
import type { AdminUser } from "@/types/AdminApiTypes";
import type { User as BackendUser } from "@/types/AuthTypes";
import type { Session } from "next-auth";

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  primaryRole: PrimaryRole;
  appRole: AppRole;
  adminRole?: "super_admin" | "department_manager";
}

export interface AuthSessionWithToken extends AuthSessionUser {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  accessTokenIssuedAt: number;
}

function resolveAuthFieldsFromRoles(roles: readonly string[]): {
  primaryRole: PrimaryRole;
  appRole: AppRole;
  adminRole?: "super_admin" | "department_manager";
} {
  const primaryRole = resolvePrimaryRole(roles);
  const appRole = resolveAppRole(roles);

  return {
    primaryRole,
    appRole,
    adminRole: appRole === "admin" ? resolveAdminRole(roles) : undefined,
  };
}

export function resolveAuthSessionUser(
  session: Session,
): AuthSessionUser | null {
  if (!session.user?.id) {
    return null;
  }

  const roles = session.user.roles ?? [];
  const resolved = resolveAuthFieldsFromRoles(roles);

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    roles,
    permissions: session.user.permissions ?? [],
    primaryRole: session.user.primaryRole ?? resolved.primaryRole,
    appRole: session.user.appRole ?? resolved.appRole,
    adminRole: session.user.adminRole ?? resolved.adminRole,
  };
}

export function mapBackendUserToAuthUser(
  backendUser: BackendUser,
  accessToken: string,
  tokenType: string,
  expiresIn: number,
): AuthSessionWithToken & {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
} {
  const appRole = resolveAppRole(backendUser.roles);
  const primaryRole = resolvePrimaryRole(backendUser.roles);

  return {
    id: String(backendUser.id),
    name: backendUser.full_name,
    email: backendUser.email,
    roles: backendUser.roles ?? [],
    permissions: backendUser.permissions ?? [],
    primaryRole,
    appRole,
    adminRole: appRole === "admin" ? resolveAdminRole(backendUser.roles) : undefined,
    accessToken,
    tokenType,
    expiresIn,
    accessTokenIssuedAt: Date.now(),
  };
}

export function mapSessionUserToAdminUser(user: AuthSessionUser): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role:
      user.adminRole ??
      (user.primaryRole === "super_admin"
        ? "super_admin"
        : "department_manager"),
    permissions: user.permissions,
  };
}

export function getSessionUser(session: Session | null): AuthSessionUser | null {
  if (!session?.user?.id) {
    return null;
  }

  return resolveAuthSessionUser(session);
}
