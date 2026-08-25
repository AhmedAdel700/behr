import type { LeaveTypeUnit } from "@/types/LeaveTypesApiTypes";

export const MINUTES_PER_WORK_DAY = 480;
export const MINUTES_PER_HOUR = 60;

export function minutesToLeaveUnits(
  minutes: number,
  unit: LeaveTypeUnit,
): number {
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
  const divisor = unit === "hour" ? MINUTES_PER_HOUR : MINUTES_PER_WORK_DAY;
  const value = safeMinutes / divisor;

  if (Number.isInteger(value)) {
    return value;
  }

  return Math.round(value * 10) / 10;
}

export function leaveUnitLabelKey(
  unit: LeaveTypeUnit,
): "days" | "hours" {
  return unit === "hour" ? "hours" : "days";
}
