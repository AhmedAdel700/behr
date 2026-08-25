import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";

export interface AttendanceImportPreviewRequest {
  branchId: string;
  file: File;
  year: number;
  month: number;
}

export interface AttendanceImportPreviewRowApiRecord {
  row: number;
  data: Record<string, unknown>;
  normalized: Record<string, unknown>;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  is_valid: boolean;
}

export interface AttendanceImportPreviewSummaryApiRecord {
  total: number;
  valid: number;
  invalid: number;
}

export interface AttendanceImportPreviewApiData {
  import_token: string;
  type: string;
  summary: AttendanceImportPreviewSummaryApiRecord;
  columns: string[];
  valid_rows: AttendanceImportPreviewRowApiRecord[];
  invalid_rows: AttendanceImportPreviewRowApiRecord[];
  warnings: unknown[];
  expires_at: string;
}

export interface AttendanceImportPreviewSummary {
  total: number;
  valid: number;
  invalid: number;
}

export interface AttendanceImportPreviewRow {
  row: number;
  data: Record<string, string>;
  normalized: Record<string, string>;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  isValid: boolean;
}

export interface AttendanceImportPreviewResult {
  message: string;
  importToken: string;
  type: string;
  summary: AttendanceImportPreviewSummary;
  columns: string[];
  validRows: AttendanceImportPreviewRow[];
  invalidRows: AttendanceImportPreviewRow[];
  warnings: string[];
  expiresAt: string;
}

export type AttendanceImportPreviewResponse =
  | {
      ok: true;
      data: AttendanceImportPreviewResult;
    }
  | {
      ok: false;
      message: string;
    };

export interface AttendanceImportConfirmRequest {
  importToken: string;
}

export interface AttendanceImportConfirmApiData {
  import_token?: string;
}

export interface AttendanceImportConfirmResult {
  message: string;
}

export type AttendanceImportConfirmResponse =
  | {
      ok: true;
      data: AttendanceImportConfirmResult;
    }
  | {
      ok: false;
      message: string;
    };

export type AttendanceImportHistoryStatus =
  | "completed"
  | "previewed"
  | (string & {});

export interface AttendanceImportHistoryApiRecord {
  id: number;
  token: string;
  type: string;
  status: AttendanceImportHistoryStatus;
  branch_id: string | number;
  month: number;
  year: number;
  original_filename: string;
  file_size_bytes: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  imported_rows: number;
  failed_rows: number;
  error_summary: string | null;
  expires_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceImportHistoryQueryParams {
  branch_id: string;
  year: number;
  page?: number;
}

export interface AttendanceImportHistoryRecord {
  id: string;
  token: string;
  type: string;
  status: AttendanceImportHistoryStatus;
  branchId: string;
  month: number;
  year: number;
  fileName: string;
  fileSizeBytes: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  failedRows: number;
  errorSummary: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceImportHistoryResult {
  items: AttendanceImportHistoryRecord[];
  meta: BranchesPaginationMeta;
}

export class AttendanceImportApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttendanceImportApiError";
  }
}
