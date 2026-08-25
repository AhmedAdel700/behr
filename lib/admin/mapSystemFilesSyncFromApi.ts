import type {
  SystemFileSyncApiData,
  SystemFileSyncFileAction,
  SystemFileSyncFileActionApiRecord,
  SystemFileSyncResult,
  SystemFileSyncSummary,
  SystemFileSyncSummaryApiRecord,
} from "@/types/SystemFilesApiTypes";

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function mapSyncFileActionFromApi(
  record: SystemFileSyncFileActionApiRecord,
): SystemFileSyncFileAction {
  return {
    type: normalizeText(record.type),
    action: normalizeText(record.action),
  };
}

function mapSyncSummaryFromApi(
  record: SystemFileSyncSummaryApiRecord,
): SystemFileSyncSummary {
  return {
    created: readCount(record.created),
    updated: readCount(record.updated),
    unchanged: readCount(record.unchanged),
    preserved: readCount(record.preserved),
    restored: readCount(record.restored),
  };
}

export function mapSystemFilesSyncFromApi(
  record: SystemFileSyncApiData,
  message: string,
): SystemFileSyncResult {
  const files = Array.isArray(record.files)
    ? record.files.map(mapSyncFileActionFromApi)
    : [];

  return {
    message,
    disk: normalizeText(record.disk),
    forced: record.forced === true,
    files,
    summary: mapSyncSummaryFromApi(record.summary),
    missingDefaults: readStringArray(record.missing_defaults),
    unregisteredFiles: readStringArray(record.unregistered_files),
    conflictingFiles: readStringArray(record.conflicting_files),
  };
}
