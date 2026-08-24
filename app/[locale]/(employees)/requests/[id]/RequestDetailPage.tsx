import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { RequestDetail } from "@/components/employee/RequestDetail";
import { fetchLeaveRequest } from "@services/leave-requests/leaveRequestsService";
import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";

export async function RequestDetailPageView({
  id,
}: {
  id: string;
}): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: LeaveRequestRecord | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchLeaveRequest(
        session.accessToken,
        locale,
        id,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <RequestDetail id={id} initialData={initialData} />;
}
