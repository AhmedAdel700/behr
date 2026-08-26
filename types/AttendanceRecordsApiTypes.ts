import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
import type { FingerprintAttendanceRecord } from "@/types/FingerprintImportApiTypes";

export interface AttendanceRecordUserApi {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  fingerprint_number: string | number | null;
  image: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordWorkShiftApi {
  id: number;
  branch_id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordApi {
  id: number;
  user_id: number;
  user: AttendanceRecordUserApi | null;
  work_shift_id: number | null;
  work_shift: AttendanceRecordWorkShiftApi | null;
  attendance_date: string | null;
  status: string;
  check_in_at: string | null;
  check_out_at: string | null;
  total_worked_minutes: number | null;
  late_minutes: number | null;
  early_leave_minutes: number | null;
  overtime_minutes: number | null;
  deduction_type: string | null;
  deduction_amount: number | string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_distance_meters: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_distance_meters: number | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordsQueryParams {
  branch_id: number;
  year: number;
  month: number;
  per_page?: number;
  page?: number;
}

export interface AttendanceRecordsListResult {
  records: FingerprintAttendanceRecord[];
  meta: BranchesPaginationMeta;
}

export const DEFAULT_ATTENDANCE_RECORDS_PER_PAGE = 25;
