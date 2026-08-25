import { mapAttendanceImportPreviewFromApi } from "@/lib/admin/mapAttendanceImportPreviewFromApi";
import {
  attendanceImportConfirmUrl,
  attendanceImportPreviewUrl,
} from "@services/imports/attendanceImportPaths";
import { createApiHttp } from "@services/http/apiHttp";
import type {
  AttendanceImportConfirmResult,
  AttendanceImportPreviewApiData,
  AttendanceImportPreviewRequest,
  AttendanceImportPreviewResult,
} from "@/types/AttendanceImportApiTypes";
import { AttendanceImportApiError } from "@/types/AttendanceImportApiTypes";

const api = createApiHttp(AttendanceImportApiError, "attendance import server");

const ATTENDANCE_IMPORT_CONFIRM_TOKEN_FIELD = "token";

export async function previewAttendanceImport(
  request: AttendanceImportPreviewRequest,
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<AttendanceImportPreviewResult> {
  const formData = new FormData();
  formData.append("file", request.file);
  formData.append("branch_id", request.branchId.trim());
  formData.append("year", String(request.year));
  formData.append("month", String(request.month));

  const { response, payload } = await api.authorizedFetch({
    url: attendanceImportPreviewUrl(),
    method: "POST",
    accessToken,
    lang,
    tokenType,
    body: formData,
    fallbackMessage: "Failed to preview attendance import.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to preview attendance import.");
  }

  const { message, data } = api.assertSuccessResponse<AttendanceImportPreviewApiData>(
    payload,
    "Failed to preview attendance import.",
  );

  return mapAttendanceImportPreviewFromApi(data, message);
}

export async function confirmAttendanceImport(
  importToken: string,
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<AttendanceImportConfirmResult> {
  const normalizedToken = importToken.trim();
  if (!normalizedToken) {
    throw new AttendanceImportApiError("Import token is required.");
  }

  const formData = new FormData();
  formData.append(ATTENDANCE_IMPORT_CONFIRM_TOKEN_FIELD, normalizedToken);

  const { response, payload } = await api.authorizedFetch({
    url: attendanceImportConfirmUrl(),
    method: "POST",
    accessToken,
    lang,
    tokenType,
    body: formData,
    fallbackMessage: "Failed to confirm attendance import.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to confirm attendance import.");
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    (payload as { success: unknown }).success !== true
  ) {
    api.throwFromPayload(payload, "Failed to confirm attendance import.");
  }

  return {
    message: api.parseApiMessage(
      payload,
      "Attendance import confirmed successfully.",
    ),
  };
}
