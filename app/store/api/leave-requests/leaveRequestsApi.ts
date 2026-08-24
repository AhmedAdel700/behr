import { baseApi } from "@/app/store/api/baseApi";
import type {
  LeaveRequestMutationResult,
  LeaveRequestPayload,
  LeaveRequestRecord,
  LeaveRequestsListQueryParams,
  LeaveRequestsListResult,
} from "@/types/LeaveRequestsApiTypes";
import {
  createLeaveRequestRequest,
  fetchAllLeaveRequests,
  fetchLeaveRequest,
  fetchLeaveRequests,
} from "@services/leave-requests/leaveRequestsService";
import { getCookie } from "cookies-next";
import { getSession } from "next-auth/react";

interface CreateLeaveRequestArgs {
  body: LeaveRequestPayload;
}

async function getLang(): Promise<string> {
  const localeCookie = await getCookie("NEXT_LOCALE");
  return typeof localeCookie === "string" ? localeCookie : "ar";
}

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export function normalizeLeaveRequestsListParams(
  arg?: LeaveRequestsListQueryParams | void,
): LeaveRequestsListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  return { page };
}

export function serializeLeaveRequestsListParams(
  params: LeaveRequestsListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
  });
}

export const DEFAULT_LEAVE_REQUESTS_LIST_PARAMS: LeaveRequestsListQueryParams = {
  page: 1,
};

export const leaveRequestsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getLeaveRequests: builder.query<
      LeaveRequestsListResult,
      LeaveRequestsListQueryParams | void
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
          const result = await fetchLeaveRequests(
            session.accessToken,
            await getLang(),
            getTokenType(session.tokenType),
            normalizeLeaveRequestsListParams(arg),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load leave requests.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs }) =>
        serializeLeaveRequestsListParams(
          normalizeLeaveRequestsListParams(queryArgs),
        ),
      providesTags: (result) =>
        result
          ? [
              ...result.leaveRequests.map((leaveRequest) => ({
                type: "LeaveRequest" as const,
                id: leaveRequest.id,
              })),
              { type: "LeaveRequest", id: "LIST" },
            ]
          : [{ type: "LeaveRequest", id: "LIST" }],
    }),
    getAllLeaveRequests: builder.query<LeaveRequestRecord[], void>({
      async queryFn() {
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
          const leaveRequests = await fetchAllLeaveRequests(
            session.accessToken,
            await getLang(),
            getTokenType(session.tokenType),
          );
          return { data: leaveRequests };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load leave requests.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((leaveRequest) => ({
                type: "LeaveRequest" as const,
                id: leaveRequest.id,
              })),
              { type: "LeaveRequest", id: "LIST" },
            ]
          : [{ type: "LeaveRequest", id: "LIST" }],
    }),
    getLeaveRequest: builder.query<LeaveRequestRecord, string>({
      async queryFn(leaveRequestId) {
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
          const leaveRequest = await fetchLeaveRequest(
            session.accessToken,
            await getLang(),
            leaveRequestId,
            getTokenType(session.tokenType),
          );
          return { data: leaveRequest };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load leave request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (_result, _error, leaveRequestId) => [
        { type: "LeaveRequest", id: leaveRequestId },
      ],
    }),
    createLeaveRequest: builder.mutation<
      LeaveRequestMutationResult,
      CreateLeaveRequestArgs
    >({
      async queryFn({ body }) {
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
          const result = await createLeaveRequestRequest(
            session.accessToken,
            await getLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to create leave request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "LeaveRequest", id: "LIST" }],
    }),
  }),
});

export const {
  useGetLeaveRequestsQuery,
  useGetAllLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useCreateLeaveRequestMutation,
} = leaveRequestsApi;
