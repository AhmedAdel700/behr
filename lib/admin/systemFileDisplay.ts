import type { KnownSystemFileType } from "@/types/SystemFilesApiTypes";

const KNOWN_SYSTEM_FILE_TYPES: readonly KnownSystemFileType[] = [
  "attendance_import_template",
  "department_import_template",
  "employee_import_template",
  "payroll_import_template",
] as const;

export function isKnownSystemFileType(
  value: string,
): value is KnownSystemFileType {
  return KNOWN_SYSTEM_FILE_TYPES.some((type) => type === value);
}

export function formatSystemFileSize(
  sizeBytes: number | null,
  emptyLabel: string,
): string {
  if (sizeBytes == null || sizeBytes < 0) {
    return emptyLabel;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
