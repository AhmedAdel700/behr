export type FingerprintAttendanceStatus = "in" | "out" | "in_out";

export interface FingerprintAttendanceRecord {
  id: string;
  date: string;
  name: string | null;
  phoneNumber: string | null;
  fingerprintId: string;
  fingerprintSerial: string | null;
  clockIn: string | null;
  clockOut: string | null;
  attendanceStatus: FingerprintAttendanceStatus;
}

export interface FingerprintImportUpload {
  id: string;
  fileName: string;
  year: number;
  month: number;
  uploadedAt: string;
  uploadedBy: string;
  recordCount: number;
}

export interface FingerprintImportMonthData {
  branchId: string;
  year: number;
  month: number;
  uploads: FingerprintImportUpload[];
  records: FingerprintAttendanceRecord[];
}

export type FingerprintImportMonthKey = `${string}-${number}-${number}`;

export interface FingerprintImportUploadRequest {
  branchId: string;
  file: File;
  year: number;
  month: number;
}

export type FingerprintImportUploadResponse =
  | {
      ok: true;
      data: FingerprintImportMonthData;
    }
  | {
      ok: false;
      message: string;
    };

export type FingerprintImportFetchResponse =
  | {
      ok: true;
      data: FingerprintImportMonthData;
    }
  | {
      ok: false;
      message: string;
    };
