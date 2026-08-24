import { baseApi } from "@/app/store/api/baseApi";
import type {
  LeaveTypeDeleteResult,
  LeaveTypePayload,
  LeaveTypeRecord,
  LeaveTypesListQueryParams,
  LeaveTypesListResult,
} from "@/types/LeaveTypesApiTypes";
import {
  createLeaveTypeRequest,
  deleteLeaveTypeRequest,
  fetchLeaveType,
  fetchLeaveTypes,
  updateLeaveTypeRequest,
} from "@services/leave-types/leaveTypesService";
import { getCookie } from "cookies-next";
import { getSession } from "next-auth/react";

interface CreateLeaveTypeArgs {
  body: LeaveTypePayload;
}

interface UpdateLeaveTypeArgs {
  leaveTypeId: string;
  body: LeaveTypePayload;
}

interface DeleteLeaveTypeArgs {
  leaveTypeId: string;
}

async function getLang(): Promise<string> {
  const localeCookie = await getCookie("NEXT_LOCALE");
  return typeof localeCookie === "string" ? localeCookie : "ar";
}

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export function normalizeLeaveTypesListParams(
  arg?: LeaveTypesListQueryParams | void,
): LeaveTypesListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  const search = arg?.search?.trim();

  return {
    page,
    ...(search ? { search } : {}),
  };
}

export function serializeLeaveTypesListParams(
  params: LeaveTypesListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
    search: params.search?.trim() ?? "",
  });
}

export const DEFAULT_LEAVE_TYPES_LIST_PARAMS: LeaveTypesListQueryParams = {
  page: 1,
};

export const leaveTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveTypes: builder.query<
      LeaveTypesListResult,
      LeaveTypesListQueryParams | void
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
          const result = await fetchLeaveTypes(
            session.accessToken,
            await getLang(),
            getTokenType(session.tokenType),
            normalizeLeaveTypesListParams(arg),
          );

          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load leave types.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs }) =>
        serializeLeaveTypesListParams(normalizeLeaveTypesListParams(queryArgs)),
      providesTags: (result) =>
        result
          ? [
              ...result.leaveTypes.map((leaveType) => ({
                type: "LeaveType" as const,
                id: leaveType.id,
              })),
              { type: "LeaveType", id: "LIST" },
            ]
          : [{ type: "LeaveType", id: "LIST" }],
    }),
    getLeaveType: builder.query<LeaveTypeRecord, string>({
      async queryFn(leaveTypeId) {
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
          const data = await fetchLeaveType(
            session.accessToken,
            await getLang(),
            leaveTypeId,
            getTokenType(session.tokenType),
          );
          return { data };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load leave type.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (_result, _error, leaveTypeId) => [
        { type: "LeaveType", id: leaveTypeId },
      ],
    }),
    createLeaveType: builder.mutation<LeaveTypeRecord, CreateLeaveTypeArgs>({
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
          const result = await createLeaveTypeRequest(
            session.accessToken,
            await getLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.leaveType };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to create leave type.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "LeaveType", id: "LIST" }],
    }),
    updateLeaveType: builder.mutation<LeaveTypeRecord, UpdateLeaveTypeArgs>({
      async queryFn({ leaveTypeId, body }) {
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
          const result = await updateLeaveTypeRequest(
            session.accessToken,
            await getLang(),
            leaveTypeId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.leaveType };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to update leave type.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "LeaveType", id: args.leaveTypeId },
        { type: "LeaveType", id: "LIST" },
      ],
    }),
    deleteLeaveType: builder.mutation<LeaveTypeDeleteResult, DeleteLeaveTypeArgs>({
      async queryFn({ leaveTypeId }) {
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
          const result = await deleteLeaveTypeRequest(
            session.accessToken,
            await getLang(),
            leaveTypeId,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to delete leave type.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "LeaveType", id: args.leaveTypeId },
        { type: "LeaveType", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetLeaveTypesQuery,
  useGetLeaveTypeQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
} = leaveTypesApi;
