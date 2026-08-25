import { baseApi } from "@/app/store/api/baseApi";
import {
  DepartmentsApiError,
  type DepartmentDeleteResult,
  type DepartmentPayload,
  type DepartmentRecord,
  type DepartmentsListQueryParams,
  type DepartmentsListResult,
} from "@/types/DepartmentsApiTypes";
import {
  createDepartmentRequest,
  deleteDepartmentRequest,
  fetchDepartmentById,
  fetchDepartments,
  updateDepartmentRequest,
} from "@services/departments/departmentsService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

interface CreateDepartmentArgs {
  body: DepartmentPayload;
}

interface UpdateDepartmentArgs {
  departmentId: string;
  body: DepartmentPayload;
}

interface DeleteDepartmentArgs {
  departmentId: string;
}

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

function toQueryFnError(
  error: unknown,
  fallback: string,
): {
  error: {
    status: "CUSTOM_ERROR";
    error: string;
    data?: { fieldErrors: Record<string, string> };
  };
} {
  if (error instanceof DepartmentsApiError) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: error.message,
        data: { fieldErrors: error.fieldErrors },
      },
    };
  }

  const message = error instanceof Error ? error.message : fallback;
  return { error: { status: "CUSTOM_ERROR", error: message } };
}

export function normalizeDepartmentsListParams(
  arg?: DepartmentsListQueryParams | void,
): DepartmentsListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  const search = arg?.search?.trim();
  const branchId = arg?.branch_id?.trim();

  return {
    page,
    ...(search ? { search } : {}),
    ...(branchId ? { branch_id: branchId } : {}),
  };
}

export function serializeDepartmentsListParams(
  params: DepartmentsListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
    search: params.search?.trim() ?? "",
    branch_id: params.branch_id?.trim() ?? "",
  });
}

export const DEFAULT_DEPARTMENTS_LIST_PARAMS: DepartmentsListQueryParams = {
  page: 1,
};

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<
      DepartmentsListResult,
      DepartmentsListQueryParams | void
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
          const result = await fetchDepartments(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
            normalizeDepartmentsListParams(arg),
          );

          return { data: result };
        } catch (error) {
          return toQueryFnError(error, "Failed to load departments.");
        }
      },
      serializeQueryArgs: ({ queryArgs }) =>
        serializeDepartmentsListParams(normalizeDepartmentsListParams(queryArgs)),
      providesTags: (result) =>
        result
          ? [
              ...result.departments.map((department) => ({
                type: "Department" as const,
                id: department.id,
              })),
              { type: "Department", id: "LIST" },
            ]
          : [{ type: "Department", id: "LIST" }],
    }),
    getDepartmentById: builder.query<DepartmentRecord, string>({
      async queryFn(departmentId) {
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
          const department = await fetchDepartmentById(
            session.accessToken,
            await getRequestLang(),
            departmentId,
            getTokenType(session.tokenType),
          );
          return { data: department };
        } catch (error) {
          return toQueryFnError(error, "Failed to load department.");
        }
      },
      providesTags: (_result, _error, departmentId) => [
        { type: "Department", id: departmentId },
      ],
    }),
    createDepartment: builder.mutation<DepartmentRecord, CreateDepartmentArgs>({
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
          const result = await createDepartmentRequest(
            session.accessToken,
            await getRequestLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.department };
        } catch (error) {
          return toQueryFnError(error, "Failed to create department.");
        }
      },
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
    updateDepartment: builder.mutation<DepartmentRecord, UpdateDepartmentArgs>({
      async queryFn({ departmentId, body }) {
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
          const result = await updateDepartmentRequest(
            session.accessToken,
            await getRequestLang(),
            departmentId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.department };
        } catch (error) {
          return toQueryFnError(error, "Failed to update department.");
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Department", id: args.departmentId },
        { type: "Department", id: "LIST" },
      ],
    }),
    deleteDepartment: builder.mutation<DepartmentDeleteResult, DeleteDepartmentArgs>({
      async queryFn({ departmentId }) {
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
          const result = await deleteDepartmentRequest(
            session.accessToken,
            await getRequestLang(),
            departmentId,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          return toQueryFnError(error, "Failed to delete department.");
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Department", id: args.departmentId },
        { type: "Department", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
