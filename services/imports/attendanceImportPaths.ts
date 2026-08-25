import { getApiBaseUrl } from "@services/auth/shared";

export function attendanceImportPreviewUrl(): string {
  return `${getApiBaseUrl()}/imports/attendance/preview`;
}

export function attendanceImportConfirmUrl(): string {
  return `${getApiBaseUrl()}/imports/attendance/confirm`;
}

export function attendanceImportFailedRowsUrl(importToken: string): string {
  return `${getApiBaseUrl()}/imports/${encodeURIComponent(importToken.trim())}/failed-rows`;
}
