import type {
  AttendanceImportHistoryApiRecord,
  AttendanceImportHistoryRecord,
} from "@/types/AttendanceImportApiTypes";

function readId(value: string | number | null | undefined): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function isAttendanceImportHistoryApiRecord(
  value: unknown,
): value is AttendanceImportHistoryApiRecord {
  const record = asRecord(value);
  const id = record ? readId(record.id as string | number) : null;

  return (
    record !== null &&
    id !== null &&
    typeof record.token === "string" &&
    typeof record.original_filename === "string" &&
    typeof record.created_at === "string"
  );
}

export function mapAttendanceImportHistoryRecordFromApi(
  record: AttendanceImportHistoryApiRecord,
): AttendanceImportHistoryRecord {
  return {
    id: String(record.id),
    token: record.token,
    type: record.type,
    status: record.status,
    branchId: readId(record.branch_id) ?? "",
    month: record.month,
    year: record.year,
    fileName: record.original_filename,
    fileSizeBytes: record.file_size_bytes,
    totalRows: record.total_rows,
    validRows: record.valid_rows,
    invalidRows: record.invalid_rows,
    importedRows: record.imported_rows,
    failedRows: record.failed_rows,
    errorSummary: record.error_summary,
    expiresAt: record.expires_at,
    confirmedAt: record.confirmed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapAttendanceImportHistoryRecordsFromApi(
  records: unknown[],
): AttendanceImportHistoryRecord[] {
  return records
    .filter(isAttendanceImportHistoryApiRecord)
    .map(mapAttendanceImportHistoryRecordFromApi);
}
