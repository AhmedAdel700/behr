import { getApiBaseUrl } from "@services/auth/shared";

export function systemFilesCollectionUrl(): string {
  return `${getApiBaseUrl()}/system-files`;
}

export function systemFileUploadUrl(type: string): string {
  return `${getApiBaseUrl()}/system-files/${encodeURIComponent(type)}/upload`;
}

export function systemFileRestoreDefaultUrl(type: string): string {
  return `${getApiBaseUrl()}/system-files/${encodeURIComponent(type)}/restore-default`;
}

export function systemFilesSyncUrl(): string {
  return `${getApiBaseUrl()}/system-files/sync`;
}

export function systemFileDownloadUrl(type: string): string {
  return `${getApiBaseUrl()}/system-files/${encodeURIComponent(type)}/download`;
}
