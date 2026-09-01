import type { LocalizedApiValue } from "@/types/ApiSharedTypes";

export interface OverviewCountsApi {
  employees: number;
  pending_registration_requests: number;
  pending_leave_requests: number;
  departments: number;
  branches: number;
}

export interface OverviewLatestRegistrationRequestApi {
  id: number;
  full_name: string;
  job_position: LocalizedApiValue;
  department: LocalizedApiValue;
  city: LocalizedApiValue;
  created_at: string;
}

export interface OverviewLatestLeaveRequestApi {
  id: number;
  employee_name: string;
  leave_type: LocalizedApiValue;
  department: LocalizedApiValue;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  reason: string;
  created_at: string;
}

export interface OverviewApiData {
  counts: OverviewCountsApi;
  latest_registration_requests: OverviewLatestRegistrationRequestApi[];
  latest_leave_requests: OverviewLatestLeaveRequestApi[];
}

export interface OverviewCounts {
  employees: number;
  pendingRegistrationRequests: number;
  pendingLeaveRequests: number;
  departments: number;
  branches: number;
}

export interface OverviewLatestRegistrationRequest {
  id: string;
  fullName: string;
  jobPosition: string;
  department: string;
  city: string;
  createdAt: string;
}

export interface OverviewLatestLeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  department: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  reason: string;
  createdAt: string;
}

export interface OverviewResult {
  counts: OverviewCounts;
  latestRegistrationRequests: OverviewLatestRegistrationRequest[];
  latestLeaveRequests: OverviewLatestLeaveRequest[];
}

export class OverviewApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OverviewApiError";
  }
}
