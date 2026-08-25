import { getSession } from "next-auth/react";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { applyLangHeader } from "@services/auth/shared";
import { systemFileDownloadUrl } from "@services/system-files/systemFilesPaths";
import type { SystemFileRecord } from "@/types/SystemFilesApiTypes";

export const ATTENDANCE_IMPORT_TEMPLATE_TYPE = "attendance_import_template";
export const ATTENDANCE_IMPORT_TEMPLATE_FILE_NAME =
  "attendance_import_template.xlsx";

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

export async function downloadSystemFileByType(
  type: string,
  fileName: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalizedType = type.trim();
  if (!normalizedType) {
    return { ok: false, message: "Download URL is not available." };
  }

  try {
    const response = await fetch(systemFileDownloadUrl(normalizedType), {
      method: "GET",
      headers: await buildDownloadHeaders(),
    });

    if (!response.ok) {
      return { ok: false, message: "Failed to download file." };
    }

    const blob = await response.blob();
    triggerBrowserFileDownload(blob, fileName);
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to download file." };
  }
}

export async function downloadSystemFile(
  file: SystemFileRecord,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!file.downloadUrl.trim()) {
    return { ok: false, message: "Download URL is not available." };
  }

  try {
    const response = await fetch(file.downloadUrl, {
      method: "GET",
      headers: await buildDownloadHeaders(),
    });

    if (!response.ok) {
      return { ok: false, message: "Failed to download file." };
    }

    const blob = await response.blob();
    triggerBrowserFileDownload(blob, file.fileName);
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to download file." };
  }
}
