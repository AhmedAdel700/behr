import { getApiBaseUrl } from "@services/auth/shared";
import type { AttendanceHistoryQueryParams } from "@/types/AttendanceApiTypes";
import type { AttendanceRecordsQueryParams } from "@/types/AttendanceRecordsApiTypes";
import { DEFAULT_ATTENDANCE_RECORDS_PER_PAGE } from "@/types/AttendanceRecordsApiTypes";

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

export function attendanceRecordsUrl(
  params: AttendanceRecordsQueryParams,
): string {
  const url = new URL(`${getApiBaseUrl()}/attendance-records`);
  url.searchParams.set("branch_id", String(params.branch_id));
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("month", String(params.month));
  url.searchParams.set(
    "per_page",
    String(params.per_page ?? DEFAULT_ATTENDANCE_RECORDS_PER_PAGE),
  );
  url.searchParams.set("page", String(params.page ?? 1));

  return url.toString();
}
