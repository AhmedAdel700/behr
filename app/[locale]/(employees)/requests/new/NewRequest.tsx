import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { RequestTypePicker } from "@/components/employee/RequestTypePicker";
import { fetchAllLeaveTypes } from "@services/leave-types/leaveTypesService";
import type { LeaveTypeRecord } from "@/types/LeaveTypesApiTypes";

export async function NewRequest(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let leaveTypes: LeaveTypeRecord[] = [];

  if (session?.accessToken) {
    try {
      const allLeaveTypes = await fetchAllLeaveTypes(
        session.accessToken,
        locale,
        session.tokenType,
      );
      leaveTypes = allLeaveTypes.filter((leaveType) => leaveType.isActive);
    } catch {
      leaveTypes = [];
    }
  }

  return <RequestTypePicker leaveTypes={leaveTypes} />;
}
