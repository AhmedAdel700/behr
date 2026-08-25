import { baseApi } from "@/app/store/api/baseApi";
import { fetchLeaveBalances } from "@services/leave-balances/leaveBalancesService";
import type {
  LeaveBalanceRecord,
  LeaveBalancesQueryParams,
} from "@/types/LeaveBalancesApiTypes";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
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
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "No active session.",
            },
          };
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
  }),
});

export const { useGetLeaveBalancesQuery } = leaveBalancesApi;
