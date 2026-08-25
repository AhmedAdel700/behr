import { getCookie } from "cookies-next";
import { getSession } from "next-auth/react";
import { normalizeLangHeader } from "@services/auth/shared";
import {
  confirmAttendanceImport,
  previewAttendanceImport,
} from "@services/imports/attendanceImportService";
import type {
  AttendanceImportConfirmResponse,
  AttendanceImportPreviewRequest,
  AttendanceImportPreviewResponse,
} from "@/types/AttendanceImportApiTypes";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export async function previewAttendanceImportClient(
  request: AttendanceImportPreviewRequest,
): Promise<AttendanceImportPreviewResponse> {
  const session = await getSession();
  if (!session?.accessToken) {
    return { ok: false, message: "No active session." };
  }

  const locale = await getCookie("NEXT_LOCALE");

  try {
    const data = await previewAttendanceImport(
      request,
      session.accessToken,
      normalizeLangHeader(typeof locale === "string" ? locale : undefined),
      getTokenType(session.tokenType),
    );
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to preview attendance import.";
    return { ok: false, message };
  }
}

export async function confirmAttendanceImportClient(
  importToken: string,
): Promise<AttendanceImportConfirmResponse> {
  const session = await getSession();
  if (!session?.accessToken) {
    return { ok: false, message: "No active session." };
  }

  const locale = await getCookie("NEXT_LOCALE");

  try {
    const data = await confirmAttendanceImport(
      importToken,
      session.accessToken,
      normalizeLangHeader(typeof locale === "string" ? locale : undefined),
      getTokenType(session.tokenType),
    );
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to confirm attendance import.";
    return { ok: false, message };
  }
}
