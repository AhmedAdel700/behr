import type {
  SystemFileApiRecord,
  SystemFileRecord,
} from "@/types/SystemFilesApiTypes";

function readId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseSystemFileType(value: unknown): string {
  const normalized = normalizeText(value).trim();
  return normalized.length > 0 ? normalized : "employee_import_template";
}

export function mapSystemFileFromApi(record: SystemFileApiRecord): SystemFileRecord {
  return {
    id: readId(record.id),
    type: parseSystemFileType(record.type),
    fileName: normalizeText(record.file_name),
    mimeType: normalizeText(record.mime_type),
    sizeBytes: readOptionalNumber(record.size_bytes),
    checksum: normalizeText(record.checksum),
    isCustomized: record.is_customized === true,
    status: record.status === true,
    downloadUrl: normalizeText(record.download_url),
    createdAt: normalizeText(record.created_at),
    updatedAt: normalizeText(record.updated_at),
  };
}

export function mapSystemFilesFromApi(
  records: readonly SystemFileApiRecord[],
): SystemFileRecord[] {
  return records.map(mapSystemFileFromApi);
}
