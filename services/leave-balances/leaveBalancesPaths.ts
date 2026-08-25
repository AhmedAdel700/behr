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
