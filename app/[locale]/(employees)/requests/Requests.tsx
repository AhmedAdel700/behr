import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { RequestsList } from "@/components/employee/RequestsList";
import { fetchAllLeaveRequests } from "@services/leave-requests/leaveRequestsService";
import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";

export async function Requests(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: LeaveRequestRecord[] | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchAllLeaveRequests(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <RequestsList initialData={initialData} />;
}
