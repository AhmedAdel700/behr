import { getSession } from "next-auth/react";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { applyLangHeader } from "@services/auth/shared";
import { attendanceImportFailedRowsUrl } from "@services/imports/attendanceImportPaths";

export const ATTENDANCE_IMPORT_FAILED_ROWS_FILE_NAME =
  "attendance-import-failed-rows.xlsx";

function triggerBrowserFileDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function readFileNameFromContentDisposition(
  contentDisposition: string | null,
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(
    contentDisposition,
  );

  if (!match) {
    return null;
  }

  const rawName = match[1] ?? match[2] ?? match[3];
  if (!rawName) {
    return null;
  }

  try {
    return decodeURIComponent(rawName.trim());
  } catch {
    return rawName.trim();
  }
}

function parseDownloadErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message.trim();
  }

  return fallback;
}

async function buildDownloadHeaders(): Promise<Headers> {
  const session = await getSession();
  const headers = new Headers();
  headers.set("Accept", "*/*");
  applyLangHeader(headers, await getRequestLang());

  if (session?.accessToken) {
    const tokenType =
      typeof session.tokenType === "string" && session.tokenType
        ? session.tokenType
        : "Bearer";
    headers.set("Authorization", `${tokenType} ${session.accessToken}`);
  }

  return headers;
}

export async function downloadAttendanceImportFailedRows(
  importToken: string,
  fallbackFileName = ATTENDANCE_IMPORT_FAILED_ROWS_FILE_NAME,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalizedToken = importToken.trim();
  if (!normalizedToken) {
    return { ok: false, message: "Import token is not available." };
  }

  try {
    const response = await fetch(attendanceImportFailedRowsUrl(normalizedToken), {
      method: "GET",
      headers: await buildDownloadHeaders(),
    });

    if (!response.ok) {
      let message = "Failed to download failed rows.";
      try {
        const payload: unknown = await response.json();
        message = parseDownloadErrorMessage(payload, message);
      } catch {
        // keep default message
      }
      return { ok: false, message };
    }

    const blob = await response.blob();
    const fileName =
      readFileNameFromContentDisposition(
        response.headers.get("Content-Disposition"),
      ) ?? fallbackFileName;
    triggerBrowserFileDownload(blob, fileName);
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to download failed rows." };
  }
}
