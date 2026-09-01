import { parseLocalizedField } from "@/lib/admin/branchLocalizedText";
import type {
  OverviewApiData,
  OverviewCountsApi,
  OverviewLatestLeaveRequest,
  OverviewLatestLeaveRequestApi,
  OverviewLatestRegistrationRequest,
  OverviewLatestRegistrationRequestApi,
  OverviewResult,
} from "@/types/OverviewApiTypes";

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizeCount(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapCountsFromApi(counts: OverviewCountsApi): OverviewResult["counts"] {
  return {
    employees: normalizeCount(counts.employees),
    pendingRegistrationRequests: normalizeCount(
      counts.pending_registration_requests,
    ),
    pendingLeaveRequests: normalizeCount(counts.pending_leave_requests),
    departments: normalizeCount(counts.departments),
    branches: normalizeCount(counts.branches),
  };
}

function mapLatestRegistrationRequestFromApi(
  record: OverviewLatestRegistrationRequestApi,
  lang: string,
): OverviewLatestRegistrationRequest {
  return {
    id: String(record.id),
    fullName: normalizeText(record.full_name),
    jobPosition: parseLocalizedField(record.job_position, lang).display,
    department: parseLocalizedField(record.department, lang).display,
    city: parseLocalizedField(record.city, lang).display,
    createdAt: normalizeText(record.created_at),
  };
}

function mapLatestLeaveRequestFromApi(
  record: OverviewLatestLeaveRequestApi,
  lang: string,
): OverviewLatestLeaveRequest {
  return {
    id: String(record.id),
    employeeName: normalizeText(record.employee_name),
    leaveType: parseLocalizedField(record.leave_type, lang).display,
    department: parseLocalizedField(record.department, lang).display,
    startAt: normalizeText(record.start_at),
    endAt: normalizeText(record.end_at),
    durationMinutes: normalizeCount(record.duration_minutes),
    reason: normalizeText(record.reason),
    createdAt: normalizeText(record.created_at),
  };
}

export function mapOverviewFromApi(data: OverviewApiData, lang: string): OverviewResult {
  return {
    counts: mapCountsFromApi(data.counts),
    latestRegistrationRequests: data.latest_registration_requests.map(
      (record) => mapLatestRegistrationRequestFromApi(record, lang),
    ),
    latestLeaveRequests: data.latest_leave_requests.map((record) =>
      mapLatestLeaveRequestFromApi(record, lang),
    ),
  };
}
