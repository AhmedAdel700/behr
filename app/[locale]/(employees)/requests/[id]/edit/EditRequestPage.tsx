import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { EditRequest } from "@/components/employee/EditRequest";
import { fetchLeaveRequest } from "@services/leave-requests/leaveRequestsService";
import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";

export async function EditRequestPageView({
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

  return <EditRequest id={id} initialData={initialData} />;
}
