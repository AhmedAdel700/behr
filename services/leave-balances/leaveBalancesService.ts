import {
  leaveBalancesAssignByBranchUrl,
  leaveBalancesAssignByDepartmentUrl,
  leaveBalancesCollectionUrl,
} from "@services/leave-balances/leaveBalancesPaths";
import { mapLeaveBalancesFromApi } from "@/lib/employee/mapLeaveBalancesFromApi";
import { createApiHttp, parseApiMessage } from "@services/http/apiHttp";
import {
  LeaveBalancesApiError,
  type AssignLeaveBalancesByBranchPayload,
  type AssignLeaveBalancesByDepartmentPayload,
  type LeaveBalanceApiRecord,
  type LeaveBalanceAssignResult,
  type LeaveBalanceRecord,
  type LeaveBalancesQueryParams,
} from "@/types/LeaveBalancesApiTypes";

const api = createApiHttp(LeaveBalancesApiError, "leave balances server");

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function parseAssignResult(
  payload: unknown,
  fallback: string,
): LeaveBalanceAssignResult {
  const record = asRecord(payload);
  if (!record || record.success !== true) {
    throw new LeaveBalancesApiError(parseApiMessage(payload, fallback));
  }

  const message =
    typeof record.message === "string" && record.message.trim()
      ? record.message
      : fallback;

  return { message };
}

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

export async function assignLeaveBalancesByBranchRequest(
  accessToken: string,
  lang: string,
  body: AssignLeaveBalancesByBranchPayload,
  tokenType = "Bearer",
): Promise<LeaveBalanceAssignResult> {
  const fallbackMessage = "Failed to assign leave balances by branch.";
  const { response, payload } = await api.authorizedFetch({
    url: leaveBalancesAssignByBranchUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage,
  });

  if (!response.ok) {
    api.throwFromPayload(payload, fallbackMessage);
  }

  return parseAssignResult(payload, fallbackMessage);
}

export async function assignLeaveBalancesByDepartmentRequest(
  accessToken: string,
  lang: string,
  body: AssignLeaveBalancesByDepartmentPayload,
  tokenType = "Bearer",
): Promise<LeaveBalanceAssignResult> {
  const fallbackMessage = "Failed to assign leave balances by department.";
  const { response, payload } = await api.authorizedFetch({
    url: leaveBalancesAssignByDepartmentUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage,
  });

  if (!response.ok) {
    api.throwFromPayload(payload, fallbackMessage);
  }

  return parseAssignResult(payload, fallbackMessage);
}
