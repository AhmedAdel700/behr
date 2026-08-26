import { attendanceHistoryUrl, attendanceRecordsUrl } from "@services/attendance/attendancePaths";
import { mapAttendanceHistoryFromApi } from "@/lib/employee/mapAttendanceHistoryFromApi";
import { mapAttendanceRecordsFromApi } from "@/lib/admin/mapAttendanceRecordsFromApi";
import { createApiHttp } from "@services/http/apiHttp";
import {
  AttendanceApiError,
  type AttendanceHistoryApiData,
  type AttendanceHistoryQueryParams,
  type AttendanceHistoryResult,
} from "@/types/AttendanceApiTypes";
import type {
  AttendanceRecordsListResult,
  AttendanceRecordsQueryParams,
} from "@/types/AttendanceRecordsApiTypes";

const api = createApiHttp(AttendanceApiError, "attendance server");

function readUserId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

export async function fetchAttendanceHistory(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: AttendanceHistoryQueryParams,
): Promise<AttendanceHistoryResult> {
  const { response, payload } = await api.authorizedFetch({
    url: attendanceHistoryUrl(params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load attendance history.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load attendance history.");
  }

  const { data } = api.assertSuccessResponse<AttendanceHistoryApiData>(
    payload,
    "Failed to load attendance history.",
  );

  return {
    userId: readUserId(data.user_id),
    from: data.from,
    to: data.to,
    months: mapAttendanceHistoryFromApi(data),
  };
}

export async function fetchAttendanceRecords(
  accessToken: string,
  lang: string,
  params: AttendanceRecordsQueryParams,
  tokenType = "Bearer",
): Promise<AttendanceRecordsListResult> {
  const { response, payload } = await api.authorizedFetch({
    url: attendanceRecordsUrl(params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load attendance records.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load attendance records.");
  }

  const { data } = api.assertSuccessResponse<unknown>(
    payload,
    "Failed to load attendance records.",
  );

  if (!Array.isArray(data)) {
    throw new AttendanceApiError("Unexpected attendance records response.");
  }

  return {
    records: mapAttendanceRecordsFromApi(data),
    meta: api.parsePaginationMeta(payload),
  };
}
