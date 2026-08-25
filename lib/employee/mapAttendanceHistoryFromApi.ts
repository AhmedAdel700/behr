import type {
  AttendanceHistoryApiData,
  AttendanceHistoryDayApi,
  AttendanceHistoryMonthApi,
} from "@/types/AttendanceApiTypes";
import type {
  AttendanceHistoryDay,
  AttendanceHistoryMark,
  AttendanceHistoryMonth,
} from "@/lib/employee/attendanceHistory";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function mapApiDayToMark(day: AttendanceHistoryDayApi): AttendanceHistoryMark | null {
  const attendanceStatus = day.attendance_status?.trim().toLowerCase() ?? "";

  if (attendanceStatus === "remote") {
    return "remote";
  }

  if (attendanceStatus === "on_site" || attendanceStatus === "on-site") {
    return "worked";
  }

  const status = day.status.trim().toLowerCase();

  if (status === "remote") {
    return "remote";
  }

  if (status === "on_site" || status === "worked") {
    return "worked";
  }

  if (status === "absent") {
    return "absent";
  }

  if (
    status === "weekend" ||
    status === "holiday" ||
    status === "leave" ||
    status === "off"
  ) {
    return "off";
  }

  if (status === "upcoming") {
    return null;
  }

  return null;
}

function mapApiMonth(month: AttendanceHistoryMonthApi): AttendanceHistoryMonth {
  const days: AttendanceHistoryDay[] = month.days.map((day) => ({
    date: day.date,
    mark: mapApiDayToMark(day),
  }));

  return {
    key: `${month.year}-${pad2(month.month)}`,
    year: month.year,
    month: month.month,
    label: month.label,
    days,
    summary: {
      workedDays: month.summary.on_site + month.summary.remote,
      absentDays: month.summary.absent,
    },
  };
}

export function mapAttendanceHistoryFromApi(
  data: AttendanceHistoryApiData,
): AttendanceHistoryMonth[] {
  return data.months.map(mapApiMonth);
}
