import { baseApi } from "@/app/store/api/baseApi";
import type {
  DepartmentDeleteResult,
  DepartmentPayload,
  DepartmentRecord,
  DepartmentsListQueryParams,
  DepartmentsListResult,
} from "@/types/DepartmentsApiTypes";
import {
  createDepartmentRequest,
  deleteDepartmentRequest,
  fetchDepartmentById,
  fetchDepartments,
  updateDepartmentRequest,
} from "@services/departments/departmentsService";
import { getCookie } from "cookies-next";
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

async function getLang(): Promise<string> {
  const localeCookie = await getCookie("NEXT_LOCALE");
  return typeof localeCookie === "string" ? localeCookie : "ar";
}

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
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
            await getLang(),
            getTokenType(session.tokenType),
            normalizeDepartmentsListParams(arg),
          );

          return { data: result };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load departments.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
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
            await getLang(),
            departmentId,
            getTokenType(session.tokenType),
          );
          return { data: department };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load department.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
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
            await getLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.department };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create department.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
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
            await getLang(),
            departmentId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.department };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to update department.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
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
            await getLang(),
            departmentId,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete department.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
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
