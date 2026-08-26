import { getApiBaseUrl } from "@services/auth/shared";
import type { LeaveBalancesQueryParams } from "@/types/LeaveBalancesApiTypes";

export function leaveBalancesCollectionUrl(
  params?: LeaveBalancesQueryParams,
): string {
  const url = new URL(`${getApiBaseUrl()}/leave-balances`);

  if (params?.userId?.trim()) {
    url.searchParams.set("user_id", params.userId.trim());
  }

  return url.toString();
}

export function leaveBalancesAssignByBranchUrl(): string {
  return `${getApiBaseUrl()}/leave-balances/assign-by-branch`;
}

export function leaveBalancesAssignByDepartmentUrl(): string {
  return `${getApiBaseUrl()}/leave-balances/assign-by-department`;
}
