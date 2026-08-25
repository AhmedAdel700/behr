import { getApiBaseUrl } from "@services/auth/shared";
import type { AttendanceImportHistoryQueryParams } from "@/types/AttendanceImportApiTypes";

export function attendanceImportPreviewUrl(): string {
  return `${getApiBaseUrl()}/imports/attendance/preview`;
}

export function attendanceImportConfirmUrl(): string {
  return `${getApiBaseUrl()}/imports/attendance/confirm`;
}

export function attendanceImportFailedRowsUrl(importToken: string): string {
  return `${getApiBaseUrl()}/imports/${encodeURIComponent(importToken.trim())}/failed-rows`;
}

export function attendanceImportHistoryUrl(
  params: AttendanceImportHistoryQueryParams,
): string {
  const url = new URL(`${getApiBaseUrl()}/imports/history`);
  url.searchParams.set("branch_id", params.branch_id.trim());
  url.searchParams.set("year", String(params.year));

  const page = params.page && params.page > 1 ? params.page : 1;
  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  return url.toString();
}
