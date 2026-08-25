import { mapSystemFilesSyncFromApi } from "@/lib/admin/mapSystemFilesSyncFromApi";
import { mapSystemFileFromApi, mapSystemFilesFromApi } from "@/lib/admin/mapSystemFilesFromApi";
import {
  systemFileRestoreDefaultUrl,
  systemFilesSyncUrl,
  systemFileUploadUrl,
  systemFilesCollectionUrl,
} from "@services/system-files/systemFilesPaths";
import { createApiHttp } from "@services/http/apiHttp";
import type {
  SystemFileApiRecord,
  SystemFileRecord,
  SystemFileSyncApiData,
  SystemFileSyncResult,
} from "@/types/SystemFilesApiTypes";
import { SystemFilesApiError } from "@/types/SystemFilesApiTypes";

const api = createApiHttp(SystemFilesApiError, "system files server");

export async function fetchSystemFiles(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<SystemFileRecord[]> {
  const { response, payload } = await api.authorizedFetch({
    url: systemFilesCollectionUrl(),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load system files.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load system files.");
  }

  const { data } = api.assertSuccessResponse<SystemFileApiRecord[]>(
    payload,
    "Failed to load system files.",
  );

  if (!Array.isArray(data)) {
    throw new SystemFilesApiError("Unexpected system files response.");
  }

  return mapSystemFilesFromApi(data);
}

export async function uploadSystemFile(
  type: string,
  file: File,
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<SystemFileRecord> {
  const normalizedType = type.trim();
  if (!normalizedType) {
    throw new SystemFilesApiError("System file type is required.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const { response, payload } = await api.authorizedFetch({
    url: systemFileUploadUrl(normalizedType),
    method: "POST",
    accessToken,
    lang,
    tokenType,
    body: formData,
    fallbackMessage: "Failed to upload system file.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to upload system file.");
  }

  const { data } = api.assertSuccessResponse<SystemFileApiRecord>(
    payload,
    "Failed to upload system file.",
  );

  return mapSystemFileFromApi(data);
}

export async function restoreSystemFileDefault(
  type: string,
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<SystemFileRecord> {
  const normalizedType = type.trim();
  if (!normalizedType) {
    throw new SystemFilesApiError("System file type is required.");
  }

  const { response, payload } = await api.authorizedFetch({
    url: systemFileRestoreDefaultUrl(normalizedType),
    method: "POST",
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to restore system file.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to restore system file.");
  }

  const { data } = api.assertSuccessResponse<SystemFileApiRecord>(
    payload,
    "Failed to restore system file.",
  );

  return mapSystemFileFromApi(data);
}

export async function syncSystemFiles(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<SystemFileSyncResult> {
  const { response, payload } = await api.authorizedFetch({
    url: systemFilesSyncUrl(),
    method: "POST",
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to sync system files.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to sync system files.");
  }

  const { message, data } = api.assertSuccessResponse<SystemFileSyncApiData>(
    payload,
    "Failed to sync system files.",
  );

  return mapSystemFilesSyncFromApi(data, message);
}
