import type { DemoRequest, RequestType } from "@/lib/employee/demo-data";

export type AttendanceHistoryMark = "worked" | "remote" | "absent" | "off";

export interface AttendanceHistoryDay {
  date: string;
  mark: AttendanceHistoryMark | null;
}

export interface AttendanceHistoryMonthSummary {
  workedDays: number;
  absentDays: number;
}

export interface AttendanceHistoryMonth {
  key: string;
  year: number;
  month: number;
  label?: string;
  days: AttendanceHistoryDay[];
  summary?: AttendanceHistoryMonthSummary;
}

/** Request types that count as a worked day on the attendance calendar. */
export const WORK_ATTENDANCE_REQUEST_TYPES = ["remote"] as const satisfies readonly RequestType[];

export function countsAsWorkInAttendance(type: RequestType): boolean {
  return (WORK_ATTENDANCE_REQUEST_TYPES as readonly string[]).includes(type);
}

export function countsAsLeaveInAttendance(type: RequestType): boolean {
  return type !== "remote" && type !== "permission";
}

function eachDateInRange(from: string, to: string): string[] {
  const start = parseISODateLocal(from);
  const end = parseISODateLocal(to);
  if (!start || !end || start > end) return [];

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(toISODateLocal(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function applyApprovedRequestsToMonth(
  days: AttendanceHistoryDay[],
  requests: readonly DemoRequest[],
  employeeId: string,
  year: number,
  month: number
): AttendanceHistoryDay[] {
  const dayMap = new Map(days.map((day) => [day.date, day]));
  const monthPrefix = `${year}-${pad2(month)}`;

  for (const request of requests) {
    if (request.employeeId !== employeeId || request.status !== "approved") {
      continue;
    }

    for (const iso of eachDateInRange(request.from, request.to)) {
      if (!iso.startsWith(monthPrefix)) continue;

      const existing = dayMap.get(iso);
      if (!existing) continue;

      if (countsAsWorkInAttendance(request.type)) {
        dayMap.set(iso, { date: iso, mark: "remote" });
      } else if (countsAsLeaveInAttendance(request.type)) {
        dayMap.set(iso, { date: iso, mark: "off" });
      }
    }
  }

  return days.map((day) => dayMap.get(day.date) ?? day);
}

/** Egypt weekend: Friday + Saturday */
export function isEgyptWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toISODateLocal(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODateLocal(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildMonthForEmployee(
  employeeId: string,
  year: number,
  monthIndex: number,
  requests: readonly DemoRequest[] = []
): AttendanceHistoryMonth {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: AttendanceHistoryDay[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const iso = toISODateLocal(date);

    if (isEgyptWeekend(date)) {
      days.push({ date: iso, mark: "off" });
      continue;
    }

    const roll = hashString(`${employeeId}:${iso}`) % 100;
    if (roll < 7) {
      days.push({ date: iso, mark: "off" });
    } else if (roll < 15) {
      days.push({ date: iso, mark: "absent" });
    } else {
      days.push({ date: iso, mark: "worked" });
    }
  }

  const appliedDays = applyApprovedRequestsToMonth(
    days,
    requests,
    employeeId,
    year,
    monthIndex + 1
  );

  return {
    key: `${year}-${pad2(monthIndex + 1)}`,
    year,
    month: monthIndex + 1,
    days: appliedDays,
  };
}

export function getEmployeeAttendanceHistoryMonths(
  employeeId: string,
  count: number,
  from: Date,
  requests: readonly DemoRequest[] = []
): AttendanceHistoryMonth[] {
  const months: AttendanceHistoryMonth[] = [];
  let year = from.getFullYear();
  let monthIndex = from.getMonth() - 1;

  for (let i = 0; i < count; i += 1) {
    if (monthIndex < 0) {
      monthIndex = 11;
      year -= 1;
    }
    months.push(buildMonthForEmployee(employeeId, year, monthIndex, requests));
    monthIndex -= 1;
  }

  return months;
}

function buildMonth(year: number, monthIndex: number): AttendanceHistoryMonth {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: AttendanceHistoryDay[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const iso = toISODateLocal(date);

    if (isEgyptWeekend(date)) {
      days.push({ date: iso, mark: "off" });
      continue;
    }

    const roll = hashString(iso) % 100;
    if (roll < 7) {
      days.push({ date: iso, mark: "off" });
    } else if (roll < 15) {
      days.push({ date: iso, mark: "absent" });
    } else {
      days.push({ date: iso, mark: "worked" });
    }
  }

  return {
    key: `${year}-${pad2(monthIndex + 1)}`,
    year,
    month: monthIndex + 1,
    days,
  };
}

export function getPreviousAttendanceMonths(
  count: number,
  from: Date
): AttendanceHistoryMonth[] {
  const months: AttendanceHistoryMonth[] = [];
  let year = from.getFullYear();
  let monthIndex = from.getMonth() - 1;

  for (let i = 0; i < count; i += 1) {
    if (monthIndex < 0) {
      monthIndex = 11;
      year -= 1;
    }
    months.push(buildMonth(year, monthIndex));
    monthIndex -= 1;
  }

  return months;
}

export function countMarks(
  days: readonly AttendanceHistoryDay[]
): Record<AttendanceHistoryMark, number> {
  return days.reduce(
    (acc, day) => {
      if (day.mark) {
        acc[day.mark] += 1;
      }
      return acc;
    },
    { worked: 0, remote: 0, absent: 0, off: 0 }
  );
}

export function getMonthWorkedCount(month: AttendanceHistoryMonth): number {
  if (month.summary) {
    return month.summary.workedDays;
  }

  const counts = countMarks(month.days);
  return counts.worked + counts.remote;
}

export function getMonthAbsentCount(month: AttendanceHistoryMonth): number {
  if (month.summary) {
    return month.summary.absentDays;
  }

  return countMarks(month.days).absent;
}

/** Stable demo months relative to the app’s demo “today” (Aug 2026). */
export const MOCK_ATTENDANCE_HISTORY_MONTHS: AttendanceHistoryMonth[] =
  getPreviousAttendanceMonths(4, new Date(2026, 7, 10));
