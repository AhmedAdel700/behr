import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminEmployeeDetailPage } from "@/components/admin/AdminEmployeeDetailPage";
import { fetchEmployee } from "@services/employees/employeesService";
import { fetchAttendanceHistory } from "@services/attendance/attendanceService";
import { fetchLeaveBalances } from "@services/leave-balances/leaveBalancesService";
import type { AttendanceHistoryResult } from "@/types/AttendanceApiTypes";
import type { LeaveBalanceRecord } from "@/types/LeaveBalancesApiTypes";
import type { EmployeeRecord } from "@/types/EmployeesApiTypes";

interface AdminEmployeeDetailRouteProps {
  params: Promise<{ employeeId: string }>;
}

export default async function AdminEmployeeDetailRoute({
  params,
}: AdminEmployeeDetailRouteProps): Promise<ReactElement> {
  const { employeeId } = await params;
  const session = await auth();
  const locale = await getLocale();
  let initialData: EmployeeRecord | undefined;
  let attendanceHistoryInitialData: AttendanceHistoryResult | undefined;
  let leaveBalancesInitialData: LeaveBalanceRecord[] | undefined;

  if (session?.accessToken && employeeId) {
    try {
      initialData = await fetchEmployee(
        session.accessToken,
        locale,
        employeeId,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }

    try {
      attendanceHistoryInitialData = await fetchAttendanceHistory(
        session.accessToken,
        locale,
        session.tokenType,
        { userId: employeeId },
      );
    } catch {
      attendanceHistoryInitialData = undefined;
    }
    try {
      leaveBalancesInitialData = await fetchLeaveBalances(
        session.accessToken,
        locale,
        session.tokenType,
        { userId: employeeId },
      );
    } catch {
      leaveBalancesInitialData = undefined;
    }
  }

  return (
    <AdminEmployeeDetailPage
      employeeId={employeeId}
      initialData={initialData}
      attendanceHistoryInitialData={attendanceHistoryInitialData}
      leaveBalancesInitialData={leaveBalancesInitialData}
    />
  );
}
