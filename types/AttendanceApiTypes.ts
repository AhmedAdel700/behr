export type AttendanceAction = "check-in" | "check-out";

export interface AttendanceLocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface AttendancePunchRequest {
  action: AttendanceAction;
  workplaceId: string;
  location: AttendanceLocationPayload;
}

export type AttendancePunchErrorCode =
  | "OUTSIDE_GEOFENCE"
  | "LOCATION_DENIED"
  | "LOCATION_UNAVAILABLE";

export type AttendancePunchResponse =
  | {
      ok: true;
      recordedAt: string;
    }
  | {
      ok: false;
      code: AttendancePunchErrorCode;
      message: string;
    };

export interface AttendanceHistoryQueryParams {
  userId?: string;
  from?: string;
  to?: string;
}

export interface AttendanceHistoryLegendApi {
  worked: string;
  remote: string;
  absent: string;
  off: string;
}

export interface AttendanceHistorySummaryApi {
  worked: number;
  on_site: number;
  remote: number;
  absent: number;
  off: number;
  holiday: number;
  leave: number;
  weekend: number;
}

export interface AttendanceHistoryDayApi {
  date: string;
  weekday: string;
  weekday_label: string;
  status: string;
  status_label: string;
  attendance_status: string | null;
  attendance_status_label: string | null;
  record: unknown;
}

export interface AttendanceHistoryMonthApi {
  year: number;
  month: number;
  label: string;
  summary: AttendanceHistorySummaryApi;
  days: AttendanceHistoryDayApi[];
}

export interface AttendanceHistoryApiData {
  user_id: number;
  from: string;
  to: string;
  legend: AttendanceHistoryLegendApi;
  months: AttendanceHistoryMonthApi[];
}

import type { AttendanceHistoryMonth } from "@/lib/employee/attendanceHistory";

export interface AttendanceHistoryResult {
  userId: string;
  from: string;
  to: string;
  months: AttendanceHistoryMonth[];
}

export class AttendanceApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttendanceApiError";
  }
}
