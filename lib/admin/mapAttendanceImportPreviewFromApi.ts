import type {
  AttendanceImportPreviewApiData,
  AttendanceImportPreviewRow,
  AttendanceImportPreviewRowApiRecord,
  AttendanceImportPreviewResult,
  AttendanceImportPreviewSummary,
  AttendanceImportPreviewSummaryApiRecord,
} from "@/types/AttendanceImportApiTypes";

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

function normalizeText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return "";
}

function stringifyRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const record: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = normalizeText(entry);
  }

  return record;
}

function mapStringArrayRecord(value: unknown): Record<string, string[]> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const record: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) {
      continue;
    }

    const messages = entry
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim());

    if (messages.length > 0) {
      record[key] = messages;
    }
  }

  return record;
}

function mapSummaryFromApi(
  record: AttendanceImportPreviewSummaryApiRecord,
): AttendanceImportPreviewSummary {
  return {
    total: readCount(record.total),
    valid: readCount(record.valid),
    invalid: readCount(record.invalid),
  };
}

function mapPreviewRowFromApi(
  record: AttendanceImportPreviewRowApiRecord,
): AttendanceImportPreviewRow {
  return {
    row: readCount(record.row),
    data: stringifyRecord(record.data),
    normalized: stringifyRecord(record.normalized),
    errors: mapStringArrayRecord(record.errors),
    warnings: mapStringArrayRecord(record.warnings),
    isValid: record.is_valid === true,
  };
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

export function mapAttendanceImportPreviewFromApi(
  record: AttendanceImportPreviewApiData,
  message: string,
): AttendanceImportPreviewResult {
  const columns = Array.isArray(record.columns)
    ? record.columns.filter(
        (column): column is string =>
          typeof column === "string" && column.trim().length > 0,
      )
    : [];

  const validRows = Array.isArray(record.valid_rows)
    ? record.valid_rows.map(mapPreviewRowFromApi)
    : [];
  const invalidRows = Array.isArray(record.invalid_rows)
    ? record.invalid_rows.map(mapPreviewRowFromApi)
    : [];

  return {
    message,
    importToken: normalizeText(record.import_token),
    type: normalizeText(record.type),
    summary: mapSummaryFromApi(record.summary),
    columns,
    validRows,
    invalidRows,
    warnings: readStringArray(record.warnings),
    expiresAt: normalizeText(record.expires_at),
  };
}
