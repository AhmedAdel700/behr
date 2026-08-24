import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminLeaveRequestsPage } from "@/components/admin/AdminLeaveRequestsPage";
import { fetchLeaveRequests } from "@services/leave-requests/leaveRequestsService";
import type { LeaveRequestsListResult } from "@/types/LeaveRequestsApiTypes";

export default async function AdminLeaveRequestsRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: LeaveRequestsListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchLeaveRequests(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminLeaveRequestsPage initialData={initialData} />;
}
