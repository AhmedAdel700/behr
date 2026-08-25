export type KnownSystemFileType =
  | "attendance_import_template"
  | "department_import_template"
  | "employee_import_template"
  | "payroll_import_template";

export interface SystemFileApiRecord {
  id: number;
  type: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  checksum: string | null;
  is_customized: boolean;
  status: boolean;
  download_url: string;
  created_at: string;
  updated_at: string;
}

export interface SystemFileRecord {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  checksum: string;
  isCustomized: boolean;
  status: boolean;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemFileUploadPayload {
  type: string;
  file: File;
}

export interface SystemFileRestorePayload {
  type: string;
}

export interface SystemFileSyncFileActionApiRecord {
  type: string;
  action: string;
}

export interface SystemFileSyncSummaryApiRecord {
  created: number;
  updated: number;
  unchanged: number;
  preserved: number;
  restored: number;
}

export interface SystemFileSyncApiData {
  disk: string;
  forced: boolean;
  files: SystemFileSyncFileActionApiRecord[];
  summary: SystemFileSyncSummaryApiRecord;
  missing_defaults: string[];
  unregistered_files: string[];
  conflicting_files: string[];
}

export interface SystemFileSyncFileAction {
  type: string;
  action: string;
}

export interface SystemFileSyncSummary {
  created: number;
  updated: number;
  unchanged: number;
  preserved: number;
  restored: number;
}

export interface SystemFileSyncResult {
  message: string;
  disk: string;
  forced: boolean;
  files: SystemFileSyncFileAction[];
  summary: SystemFileSyncSummary;
  missingDefaults: string[];
  unregisteredFiles: string[];
  conflictingFiles: string[];
}

export class SystemFilesApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SystemFilesApiError";
  }
}
