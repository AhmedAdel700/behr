import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminLeaveTypesPage } from "@/components/admin/AdminLeaveTypesPage";
import { fetchLeaveTypes } from "@services/leave-types/leaveTypesService";
import type { LeaveTypesListResult } from "@/types/LeaveTypesApiTypes";

export default async function AdminLeaveTypesRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: LeaveTypesListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchLeaveTypes(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminLeaveTypesPage initialData={initialData} />;
}
