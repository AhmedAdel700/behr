import type { Session } from "next-auth";
import { resolveAvatarSrc } from "@/lib/employee/avatar";

export interface SidebarUserInfo {
  name: string;
  email: string;
  imageSrc: string | null;
  jobPosition: string | null;
  department: string | null;
}

function optionalTrimmed(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getSidebarUserInfo(
  session: Session | null | undefined,
): SidebarUserInfo {
  const user = session?.user;

  return {
    name: optionalTrimmed(user?.name) ?? "",
    email: optionalTrimmed(user?.email) ?? "",
    imageSrc: resolveAvatarSrc(user?.image),
    jobPosition: optionalTrimmed(user?.jobPosition),
    department: optionalTrimmed(user?.department),
  };
}

export function getSidebarDisplayName(user: SidebarUserInfo): string {
  return user.name || user.email;
}

export function getSidebarRoleLabel(
  user: SidebarUserInfo,
  fallback: string,
): string {
  return user.jobPosition ?? user.department ?? fallback;
}
