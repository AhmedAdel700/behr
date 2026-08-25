import { leaveBalancesCollectionUrl } from "@services/leave-balances/leaveBalancesPaths";
import { mapLeaveBalancesFromApi } from "@/lib/employee/mapLeaveBalancesFromApi";
import { createApiHttp } from "@services/http/apiHttp";
import {
  LeaveBalancesApiError,
  type LeaveBalanceApiRecord,
  type LeaveBalanceRecord,
  type LeaveBalancesQueryParams,
} from "@/types/LeaveBalancesApiTypes";

const api = createApiHttp(LeaveBalancesApiError, "leave balances server");

export async function fetchLeaveBalances(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: LeaveBalancesQueryParams,
): Promise<LeaveBalanceRecord[]> {
  const { response, payload } = await api.authorizedFetch({
    url: leaveBalancesCollectionUrl(params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load leave balances.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load leave balances.");
  }

  const { data } = api.assertSuccessResponse<LeaveBalanceApiRecord[]>(
    payload,
    "Failed to load leave balances.",
  );

  return mapLeaveBalancesFromApi(data);
}
