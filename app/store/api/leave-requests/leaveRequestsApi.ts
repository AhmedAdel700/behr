import { baseApi } from "@/app/store/api/baseApi";
import type {
  LeaveRequestMutationResult,
  LeaveRequestPayload,
  LeaveRequestRecord,
  LeaveRequestStatus,
  LeaveRequestsListQueryParams,
  LeaveRequestsListResult,
  RejectLeaveRequestPayload,
} from "@/types/LeaveRequestsApiTypes";
import {
  approveLeaveRequestRequest,
  createLeaveRequestRequest,
  fetchAllLeaveRequests,
  fetchLeaveRequest,
  fetchLeaveRequests,
  rejectLeaveRequestRequest,
  updateLeaveRequestRequest,
} from "@services/leave-requests/leaveRequestsService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

interface CreateLeaveRequestArgs {
  body: LeaveRequestPayload;
}

interface UpdateLeaveRequestArgs {
  leaveRequestId: string;
  body: LeaveRequestPayload;
}

interface ReviewLeaveRequestArgs {
  leaveRequestId: string;
}

interface RejectLeaveRequestArgs {
  leaveRequestId: string;
  body: RejectLeaveRequestPayload;
}

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export function normalizeLeaveRequestsListParams(
  arg?: LeaveRequestsListQueryParams | void,
): LeaveRequestsListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  const search = arg?.search?.trim();
  const status = parseLeaveRequestStatusFilter(arg?.status);

  return {
    page,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
  };
}

export function parseLeaveRequestStatusFilter(
  value: string | LeaveRequestStatus | undefined | null,
): LeaveRequestStatus | undefined {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  return undefined;
}

export function serializeLeaveRequestsListParams(
  params: LeaveRequestsListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
    search: params.search?.trim() ?? "",
    status: params.status ?? "",
  });
}

export const DEFAULT_LEAVE_REQUESTS_LIST_PARAMS: LeaveRequestsListQueryParams = {
  page: 1,
};

export const PENDING_LEAVE_REQUESTS_LIST_PARAMS: LeaveRequestsListQueryParams = {
  page: 1,
  status: "pending",
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
            await getRequestLang(),
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
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${serializeLeaveRequestsListParams(
          normalizeLeaveRequestsListParams(queryArgs),
        )})`,
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
            await getRequestLang(),
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
            await getRequestLang(),
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
            await getRequestLang(),
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
    updateLeaveRequest: builder.mutation<
      LeaveRequestMutationResult,
      UpdateLeaveRequestArgs
    >({
      async queryFn({ leaveRequestId, body }) {
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
          const result = await updateLeaveRequestRequest(
            session.accessToken,
            await getRequestLang(),
            leaveRequestId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to update leave request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, { leaveRequestId }) => [
        { type: "LeaveRequest", id: leaveRequestId },
        { type: "LeaveRequest", id: "LIST" },
      ],
    }),
    approveLeaveRequest: builder.mutation<
      LeaveRequestMutationResult,
      ReviewLeaveRequestArgs
    >({
      async queryFn({ leaveRequestId }) {
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
          const result = await approveLeaveRequestRequest(
            session.accessToken,
            await getRequestLang(),
            leaveRequestId,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to approve leave request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, { leaveRequestId }) => [
        { type: "LeaveRequest", id: leaveRequestId },
        { type: "LeaveRequest", id: "LIST" },
      ],
    }),
    rejectLeaveRequest: builder.mutation<
      LeaveRequestMutationResult,
      RejectLeaveRequestArgs
    >({
      async queryFn({ leaveRequestId, body }) {
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
          const result = await rejectLeaveRequestRequest(
            session.accessToken,
            await getRequestLang(),
            leaveRequestId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to reject leave request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, { leaveRequestId }) => [
        { type: "LeaveRequest", id: leaveRequestId },
        { type: "LeaveRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetLeaveRequestsQuery,
  useGetAllLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveRequestMutation,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
} = leaveRequestsApi;
