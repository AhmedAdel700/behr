import type { LeaveTypeUnit } from "@/types/LeaveTypesApiTypes";
import { formatDateTime12 } from "@/lib/formatTime";

export const DEFAULT_DAY_START_TIME = "09:00";
export const DEFAULT_DAY_END_TIME = "17:00";

export function buildLeaveRequestDateTime(date: string, time: string): string {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim();
  const withSeconds = /^\d{2}:\d{2}$/.test(trimmedTime)
    ? `${trimmedTime}:00`
    : trimmedTime;

  return `${trimmedDate} ${withSeconds}`;
}

export function formatLeaveRequestRange(
  startAt: string,
  endAt: string,
  locale: string,
  unit: LeaveTypeUnit,
): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return startAt === endAt ? startAt : `${startAt} → ${endAt}`;
  }

  if (unit === "hour") {
    return `${formatDateTime12(start, locale)} → ${formatDateTime12(end, locale)}`;
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const startLabel = dateFmt.format(start);
  const endLabel = dateFmt.format(end);
  return startLabel === endLabel ? startLabel : `${startLabel} → ${endLabel}`;
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
