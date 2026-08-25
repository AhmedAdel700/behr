import { attendanceHistoryUrl } from "@services/attendance/attendancePaths";
import { mapAttendanceHistoryFromApi } from "@/lib/employee/mapAttendanceHistoryFromApi";
import { createApiHttp } from "@services/http/apiHttp";
import {
  AttendanceApiError,
  type AttendanceHistoryApiData,
  type AttendanceHistoryQueryParams,
  type AttendanceHistoryResult,
} from "@/types/AttendanceApiTypes";

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
