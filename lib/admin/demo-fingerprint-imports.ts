import {
  buildDemoFingerprintRecords,
  buildFingerprintAttendanceRecord,
  isWeekday,
} from "@/lib/admin/buildFingerprintAttendanceRecords";
import { MOCK_ADMIN_EMPLOYEES } from "@/lib/admin/demo-data";
import type {
  FingerprintAttendanceRecord,
  FingerprintImportMonthData,
  FingerprintImportUpload,
} from "@/types/FingerprintImportApiTypes";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function buildDemoUpload(
  year: number,
  month: number,
  fileName: string,
  uploadedAt: string
): FingerprintImportUpload {
  const records = buildDemoFingerprintRecords(year, month);
  return {
    id: `upload-${year}-${month}-demo`,
    fileName,
    year,
    month,
    uploadedAt,
    uploadedBy: "Layla Hassan",
    recordCount: records.length,
  };
}

const now = new Date();
const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth();
const previousYear =
  now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

export const MOCK_FINGERPRINT_IMPORT_MONTHS: FingerprintImportMonthData[] = [
  {
    branchId: "1",
    year: previousYear,
    month: previousMonth,
    uploads: [
      buildDemoUpload(
        previousYear,
        previousMonth,
        "attendance-export-july.xlsx",
        new Date(previousYear, previousMonth - 1, 5, 10, 30).toISOString()
      ),
    ],
    records: buildDemoFingerprintRecords(previousYear, previousMonth),
  },
];

export function buildStubFingerprintRecords(
  year: number,
  month: number,
  fileName: string
): FingerprintAttendanceRecord[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const employeeCount = Math.min(
    MOCK_ADMIN_EMPLOYEES.length,
    3 + (fileName.length % 4)
  );
  const records = [];

  for (const employee of MOCK_ADMIN_EMPLOYEES.slice(0, employeeCount)) {
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (!isWeekday(year, month, day)) continue;

      const clockIn = `${pad2(8)}:${pad2(30 + (day % 25))}`;
      const clockOut =
        day % 9 === 0
          ? null
          : `${pad2(16 + (day % 2))}:${pad2(45 + (day % 10))}`;

      records.push(
        buildFingerprintAttendanceRecord(
          employee,
          year,
          month,
          day,
          clockIn,
          clockOut,
          `-${Date.now()}`
        )
      );
    }
  }

  return records;
}
