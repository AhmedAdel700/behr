import { baseApi } from "@/app/store/api/baseApi";
import {
  assignLeaveBalancesByBranchRequest,
  assignLeaveBalancesByDepartmentRequest,
  fetchLeaveBalances,
} from "@services/leave-balances/leaveBalancesService";
import type {
  AssignLeaveBalancesByBranchPayload,
  AssignLeaveBalancesByDepartmentPayload,
  LeaveBalanceAssignResult,
  LeaveBalanceRecord,
  LeaveBalancesQueryParams,
} from "@/types/LeaveBalancesApiTypes";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

function noSessionError(): {
  error: { status: "CUSTOM_ERROR"; error: string };
} {
  return {
    error: {
      status: "CUSTOM_ERROR",
      error: "No active session.",
    },
  };
}

export function normalizeLeaveBalancesParams(
  arg?: LeaveBalancesQueryParams | void,
): LeaveBalancesQueryParams {
  const userId = arg?.userId?.trim();
  return userId ? { userId } : {};
}

export function serializeLeaveBalancesParams(
  params: LeaveBalancesQueryParams,
): string {
  return JSON.stringify({
    userId: params.userId ?? "",
  });
}

export const leaveBalancesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getLeaveBalances: builder.query<
      LeaveBalanceRecord[],
      LeaveBalancesQueryParams | void
    >({
      async queryFn(arg) {
        const session = await getSession();
        if (!session?.accessToken) {
          return noSessionError();
        }

        try {
          const balances = await fetchLeaveBalances(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
            normalizeLeaveBalancesParams(arg),
          );
          return { data: balances };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load leave balances.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${serializeLeaveBalancesParams(
          normalizeLeaveBalancesParams(queryArgs),
        )})`,
      providesTags: (_result, _error, arg) => [
        {
          type: "LeaveBalance" as const,
          id: normalizeLeaveBalancesParams(arg).userId || "SELF",
        },
      ],
    }),
    assignLeaveBalancesByBranch: builder.mutation<
      LeaveBalanceAssignResult,
      AssignLeaveBalancesByBranchPayload
    >({
      async queryFn(body) {
        const session = await getSession();
        if (!session?.accessToken) {
          return noSessionError();
        }

        try {
          const result = await assignLeaveBalancesByBranchRequest(
            session.accessToken,
            await getRequestLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to assign leave balances by branch.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "LeaveBalance" }],
    }),
    assignLeaveBalancesByDepartment: builder.mutation<
      LeaveBalanceAssignResult,
      AssignLeaveBalancesByDepartmentPayload
    >({
      async queryFn(body) {
        const session = await getSession();
        if (!session?.accessToken) {
          return noSessionError();
        }

        try {
          const result = await assignLeaveBalancesByDepartmentRequest(
            session.accessToken,
            await getRequestLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to assign leave balances by department.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "LeaveBalance" }],
    }),
  }),
});

export const {
  useGetLeaveBalancesQuery,
  useAssignLeaveBalancesByBranchMutation,
  useAssignLeaveBalancesByDepartmentMutation,
} = leaveBalancesApi;
