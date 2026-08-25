import { baseApi } from "@/app/store/api/baseApi";
import type {
  AttendanceImportHistoryQueryParams,
  AttendanceImportHistoryResult,
} from "@/types/AttendanceImportApiTypes";
import { fetchAttendanceImportHistory } from "@services/imports/attendanceImportService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export function normalizeAttendanceImportHistoryParams(
  arg?: AttendanceImportHistoryQueryParams | void,
): AttendanceImportHistoryQueryParams | null {
  const branchId = arg?.branch_id?.trim();
  const year = arg?.year;
  const page = arg?.page && arg.page > 1 ? arg.page : 1;

  if (!branchId || typeof year !== "number" || !Number.isFinite(year)) {
    return null;
  }

  return {
    branch_id: branchId,
    year,
    page,
  };
}

export function serializeAttendanceImportHistoryParams(
  params: AttendanceImportHistoryQueryParams,
): string {
  return JSON.stringify({
    branch_id: params.branch_id.trim(),
    year: params.year,
    page: params.page ?? 1,
  });
}

export const attendanceImportApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAttendanceImportHistory: builder.query<
      AttendanceImportHistoryResult,
      AttendanceImportHistoryQueryParams | void
    >({
      async queryFn(arg) {
        const params = normalizeAttendanceImportHistoryParams(arg);
        if (!params) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Branch and year are required.",
            },
          };
        }

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
          const result = await fetchAttendanceImportHistory(
            session.accessToken,
            await getRequestLang(),
            params,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load import history.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const params = normalizeAttendanceImportHistoryParams(queryArgs);
        return params
          ? serializeAttendanceImportHistoryParams(params)
          : "invalid";
      },
      providesTags: [{ type: "AttendanceImport", id: "HISTORY" }],
    }),
  }),
});

export const { useGetAttendanceImportHistoryQuery } = attendanceImportApi;
