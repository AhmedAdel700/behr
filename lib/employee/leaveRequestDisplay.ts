import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";
import type { LeaveTypeUnit } from "@/types/LeaveTypesApiTypes";
import { isTimeBasedLeaveUnit } from "@/types/LeaveTypesApiTypes";
import type { RequestFormValues } from "@/schemas/employee/request.schema";
import {
  formatDateTime12,
  formatRangeLabel,
  formatStoredDate,
  resolveTimeLocale,
} from "@/lib/formatTime";

export const DEFAULT_DAY_START_TIME = "09:00";
export const DEFAULT_DAY_END_TIME = "17:00";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function buildLeaveRequestDateTime(date: string, time: string): string {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim();
  const withSeconds = /^\d{2}:\d{2}$/.test(trimmedTime)
    ? `${trimmedTime}:00`
    : trimmedTime;

  return `${trimmedDate} ${withSeconds}`;
}

export function buildLeaveRequestUpdatePayload(
  leaveTypeId: number,
  values: RequestFormValues,
  unit: LeaveTypeUnit,
): {
  leave_type_id: number;
  start_at: string;
  end_at: string;
  reason: string;
} {
  const reason = values.reason.trim();

  if (isTimeBasedLeaveUnit(unit)) {
    return {
      leave_type_id: leaveTypeId,
      start_at: buildLeaveRequestDateTime(values.from, values.startTime ?? ""),
      end_at: buildLeaveRequestDateTime(values.from, values.endTime ?? ""),
      reason,
    };
  }

  return {
    leave_type_id: leaveTypeId,
    start_at: values.from.trim(),
    end_at: (values.to ?? values.from).trim(),
    reason,
  };
}

function readIsoDate(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  if (match?.[1]) {
    return match[1];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function readTimeValue(value: string): string {
  const match = /(?:T|\s)(\d{2}:\d{2})/.exec(value.trim());
  if (match?.[1]) {
    return match[1];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function parseLeaveRequestFormValues(
  record: LeaveRequestRecord,
): RequestFormValues {
  const startDate = readIsoDate(record.startAt);
  const endDate = readIsoDate(record.endAt);

  if (isTimeBasedLeaveUnit(record.leaveType.unit)) {
    return {
      from: startDate,
      to: startDate,
      startTime: readTimeValue(record.startAt),
      endTime: readTimeValue(record.endAt),
      reason: record.reason,
    };
  }

  return {
    from: startDate,
    to: endDate || startDate,
    reason: record.reason,
    startTime: "",
    endTime: "",
  };
}
export function formatLeaveRequestRange(
  startAt: string,
  endAt: string,
  locale: string,
  unit: LeaveTypeUnit,
): string {
  const timeLocale = resolveTimeLocale(locale);

  if (isTimeBasedLeaveUnit(unit)) {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return formatRangeLabel(startAt, endAt, locale);
    }

    return formatRangeLabel(
      formatDateTime12(start, timeLocale),
      formatDateTime12(end, timeLocale),
      locale,
    );
  }

  const startDate = readIsoDate(startAt);
  const endDate = readIsoDate(endAt);

  if (startDate && endDate) {
    const startLabel = formatStoredDate(startDate, timeLocale);
    const endLabel = formatStoredDate(endDate, timeLocale);
    return formatRangeLabel(startLabel, endLabel, locale);
  }

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return formatRangeLabel(startAt, endAt, locale);
  }

  const dateFmt = new Intl.DateTimeFormat(timeLocale, { dateStyle: "medium" });
  const startLabel = dateFmt.format(start);
  const endLabel = dateFmt.format(end);
  return formatRangeLabel(startLabel, endLabel, locale);
}

export function getLeaveRequestMutationError(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "string" &&
    error.error.trim()
  ) {
    return error.error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}