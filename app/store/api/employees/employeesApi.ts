import { baseApi } from "@/app/store/api/baseApi";
import {
  EmployeesApiError,
  type CreateEmployeePayload,
  type EmployeeDeleteResult,
  type EmployeeMutationResult,
  type EmployeePayload,
  type EmployeeRecord,
  type EmployeesListQueryParams,
  type EmployeesListResult,
} from "@/types/EmployeesApiTypes";
import {
  createEmployeeRequest,
  deleteEmployeeRequest,
  fetchEmployee,
  fetchEmployees,
  updateEmployeeRequest,
} from "@services/employees/employeesService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

interface CreateEmployeeArgs {
  body: CreateEmployeePayload;
}

interface UpdateEmployeeArgs {
  employeeId: string;
  body: EmployeePayload;
}

interface DeleteEmployeeArgs {
  employeeId: string;
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
  if (error instanceof EmployeesApiError) {
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

export function normalizeEmployeesListParams(
  arg?: EmployeesListQueryParams | void,
): EmployeesListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  const search = arg?.search?.trim();
  const branchId = arg?.branch_id?.trim();
  const departmentId = arg?.department_id?.trim();

  return {
    page,
    ...(search ? { search } : {}),
    ...(branchId ? { branch_id: branchId } : {}),
    ...(departmentId ? { department_id: departmentId } : {}),
  };
}

export function serializeEmployeesListParams(
  params: EmployeesListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
    search: params.search?.trim() ?? "",
    branch_id: params.branch_id?.trim() ?? "",
    department_id: params.department_id?.trim() ?? "",
  });
}

export const DEFAULT_EMPLOYEES_LIST_PARAMS: EmployeesListQueryParams = {
  page: 1,
};

export const employeesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getEmployees: builder.query<
      EmployeesListResult,
      EmployeesListQueryParams | void
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
          const result = await fetchEmployees(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
            normalizeEmployeesListParams(arg),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load employees.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${serializeEmployeesListParams(
          normalizeEmployeesListParams(queryArgs),
        )})`,
      providesTags: (result) =>
        result
          ? [
              ...result.employees.map((employee) => ({
                type: "Employee" as const,
                id: employee.id,
              })),
              { type: "Employee", id: "LIST" },
            ]
          : [{ type: "Employee", id: "LIST" }],
    }),
    getEmployee: builder.query<EmployeeRecord, string>({
      async queryFn(employeeId) {
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
          const data = await fetchEmployee(
            session.accessToken,
            await getRequestLang(),
            employeeId,
            getTokenType(session.tokenType),
          );
          return { data };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load employee.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (_result, _error, employeeId) => [
        { type: "Employee", id: employeeId },
      ],
    }),
    createEmployee: builder.mutation<EmployeeMutationResult, CreateEmployeeArgs>({
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
          const data = await createEmployeeRequest(
            session.accessToken,
            await getRequestLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data };
        } catch (error) {
          return toQueryFnError(error, "Failed to create employee.");
        }
      },
      invalidatesTags: [{ type: "Employee", id: "LIST" }],
    }),
    updateEmployee: builder.mutation<EmployeeRecord, UpdateEmployeeArgs>({
      async queryFn({ employeeId, body }) {
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
          const result = await updateEmployeeRequest(
            session.accessToken,
            await getRequestLang(),
            employeeId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.employee };
        } catch (error) {
          return toQueryFnError(error, "Failed to update employee.");
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Employee", id: args.employeeId },
        { type: "Employee", id: "LIST" },
      ],
    }),
    deleteEmployee: builder.mutation<EmployeeDeleteResult, DeleteEmployeeArgs>({
      async queryFn({ employeeId }) {
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
          const result = await deleteEmployeeRequest(
            session.accessToken,
            await getRequestLang(),
            employeeId,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to delete employee.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Employee", id: args.employeeId },
        { type: "Employee", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeesApi;
