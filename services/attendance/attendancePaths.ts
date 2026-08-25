import { getApiBaseUrl } from "@services/auth/shared";
import type { AttendanceHistoryQueryParams } from "@/types/AttendanceApiTypes";

export function attendanceHistoryUrl(
  params?: AttendanceHistoryQueryParams,
): string {
  const url = new URL(`${getApiBaseUrl()}/attendance/history`);

  if (params?.userId?.trim()) {
    url.searchParams.set("user_id", params.userId.trim());
  }

  if (params?.from?.trim()) {
    url.searchParams.set("from", params.from.trim());
  }

  if (params?.to?.trim()) {
    url.searchParams.set("to", params.to.trim());
  }

  return url.toString();
}
