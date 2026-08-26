import type { AttendanceRecordApi } from "@/types/AttendanceRecordsApiTypes";
import type {
  FingerprintAttendanceRecord,
  FingerprintAttendanceStatus,
} from "@/types/FingerprintImportApiTypes";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function readId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function readText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function extractClockTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = /(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? null;
}

function resolveAttendanceStatus(
  clockIn: string | null,
  clockOut: string | null,
): FingerprintAttendanceStatus {
  if (clockIn && clockOut) return "in_out";
  if (clockIn) return "in";
  if (clockOut) return "out";
  return "in";
}

export function isAttendanceRecordApi(
  value: unknown,
): value is AttendanceRecordApi {
  const record = asRecord(value);
  return record !== null && readId(record.id) !== null;
}

export function mapAttendanceRecordFromApi(
  record: AttendanceRecordApi,
): FingerprintAttendanceRecord {
  const user = asRecord(record.user);
  const clockIn = extractClockTime(readText(record.check_in_at));
  const clockOut = extractClockTime(readText(record.check_out_at));

  return {
    id: readId(record.id) ?? "",
    date: readText(record.attendance_date) ?? "",
    name: user ? readText(user.full_name) ?? readText(user.name) : null,
    phoneNumber: user ? readText(user.phone) : null,
    fingerprintId: user ? (readText(user.fingerprint_number) ?? "") : "",
    fingerprintSerial: null,
    clockIn,
    clockOut,
    attendanceStatus: resolveAttendanceStatus(clockIn, clockOut),
  };
}

export function mapAttendanceRecordsFromApi(
  records: unknown[],
): FingerprintAttendanceRecord[] {
  return records
    .filter(isAttendanceRecordApi)
    .map(mapAttendanceRecordFromApi)
    .filter((record) => record.id.length > 0);
}
