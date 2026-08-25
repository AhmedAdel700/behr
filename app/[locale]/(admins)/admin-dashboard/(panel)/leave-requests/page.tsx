import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminLeaveRequestsPage } from "@/components/admin/AdminLeaveRequestsPage";
import {
  normalizeLeaveRequestsListParams,
  parseLeaveRequestStatusFilter,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import { fetchLeaveRequests } from "@services/leave-requests/leaveRequestsService";
import type { LeaveRequestsListResult } from "@/types/LeaveRequestsApiTypes";

interface AdminLeaveRequestsRouteProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

export default async function AdminLeaveRequestsRoute({
  searchParams,
}: AdminLeaveRequestsRouteProps): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  const params = await searchParams;
  const initialStatus = parseLeaveRequestStatusFilter(params.status);
  const initialSearch = params.search?.trim() ?? "";
  const listParams = normalizeLeaveRequestsListParams({
    page: 1,
    search: initialSearch,
    status: initialStatus,
  });

  let initialData: LeaveRequestsListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchLeaveRequests(
        session.accessToken,
        locale,
        session.tokenType,
        listParams,
      );
    } catch {
      initialData = undefined;
    }
  }

  return (
    <AdminLeaveRequestsPage
      initialData={initialData}
      initialStatus={initialStatus}
      initialSearch={initialSearch}
    />
  );
}
