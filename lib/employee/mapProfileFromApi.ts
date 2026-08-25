import { resolveAvatarSrc } from "@/lib/employee/avatar";
import { resolveTimeLocale } from "@/lib/formatTime";
import type { ProfileApiRecord, ProfileResult } from "@/types/ProfileApiTypes";

function readId(value: number | string | null | undefined): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatRoleLabel(roles: readonly string[]): string {
  const role = roles[0]?.trim();
  if (!role) {
    return "";
  }

  return role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatJoinDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(resolveTimeLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBranchLabel(
  branch: ProfileApiRecord["branch"],
  fallback: string,
): string {
  if (!branch) {
    return fallback;
  }

  const name = normalizeText(branch.name);
  const city = normalizeText(branch.city);

  if (name && city) {
    return `${name} · ${city}`;
  }

  return name || city || fallback;
}

export function mapProfileFromApi(
  record: ProfileApiRecord,
  locale: string,
  notAvailableLabel: string,
): ProfileResult {
  const avatarSrc = resolveAvatarSrc(record.image) ?? "";
  const jobPosition = normalizeText(record.job_position?.name);
  const department = normalizeText(record.department?.name);
  const manager = record.department?.manager;

  return {
    name: normalizeText(record.full_name),
    role: jobPosition || formatRoleLabel(record.roles),
    email: normalizeText(record.email),
    phone: normalizeText(record.phone) || notAvailableLabel,
    fingerprintNumber:
      normalizeText(record.fingerprint_number) || notAvailableLabel,
    avatarSrc,
    department: department || notAvailableLabel,
    branch: formatBranchLabel(record.branch, notAvailableLabel),
    lineManager: normalizeText(manager?.full_name) || notAvailableLabel,
    lineManagerRole: normalizeText(manager?.email),
    employeeId: readId(record.id) ?? notAvailableLabel,
    joinDate: formatJoinDate(record.created_at, locale),
    roles: [...record.roles],
    permissions: [...record.permissions],
    jobPositionId: readId(record.job_position?.id),
    branchId: readId(record.branch?.id),
    departmentId: readId(record.department?.id),
    lineManagerId: readId(manager?.id),
  };
}
