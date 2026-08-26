import { baseApi } from "@/app/store/api/baseApi";
import {
  fetchAttendanceHistory,
  fetchAttendanceRecords,
} from "@services/attendance/attendanceService";
import type {
  AttendanceHistoryQueryParams,
  AttendanceHistoryResult,
} from "@/types/AttendanceApiTypes";
import type {
  AttendanceRecordsListResult,
  AttendanceRecordsQueryParams,
} from "@/types/AttendanceRecordsApiTypes";
import { DEFAULT_ATTENDANCE_RECORDS_PER_PAGE } from "@/types/AttendanceRecordsApiTypes";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export function normalizeAttendanceHistoryParams(
  arg?: AttendanceHistoryQueryParams | void,
): AttendanceHistoryQueryParams {
  const userId = arg?.userId?.trim();
  const from = arg?.from?.trim();
  const to = arg?.to?.trim();

  return {
    ...(userId ? { userId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

export function serializeAttendanceHistoryParams(
  params: AttendanceHistoryQueryParams,
): string {
  return JSON.stringify({
    userId: params.userId ?? "",
    from: params.from ?? "",
    to: params.to ?? "",
  });
}

export const attendanceApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAttendanceHistory: builder.query<
      AttendanceHistoryResult,
      AttendanceHistoryQueryParams | void
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
          const result = await fetchAttendanceHistory(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
            normalizeAttendanceHistoryParams(arg),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load attendance history.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${serializeAttendanceHistoryParams(
          normalizeAttendanceHistoryParams(queryArgs),
        )})`,
      providesTags: (_result, _error, arg) => [
        {
          type: "Attendance" as const,
          id: normalizeAttendanceHistoryParams(arg).userId || "SELF",
        },
      ],
    }),
    getAttendanceRecords: builder.query<
      AttendanceRecordsListResult,
      AttendanceRecordsQueryParams | void
    >({
      async queryFn(arg) {
        const params = normalizeAttendanceRecordsParams(arg);
        if (!params) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Branch, year, and month are required.",
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
          const result = await fetchAttendanceRecords(
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
              : "Failed to load attendance records.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const params = normalizeAttendanceRecordsParams(queryArgs);
        return params
          ? serializeAttendanceRecordsParams(params)
          : "invalid";
      },
      providesTags: (_result, _error, arg) => {
        const params = normalizeAttendanceRecordsParams(arg);
        if (!params) {
          return [{ type: "Attendance" as const, id: "RECORDS" }];
        }

        return [
          { type: "Attendance" as const, id: "RECORDS" },
          {
            type: "Attendance" as const,
            id: `RECORDS-${params.branch_id}-${params.year}-${params.month}`,
          },
        ];
      },
    }),
  }),
});

export function normalizeAttendanceRecordsParams(
  arg?: AttendanceRecordsQueryParams | void,
): AttendanceRecordsQueryParams | null {
  if (!arg) {
    return null;
  }

  const branchId = arg.branch_id;
  const year = arg.year;
  const month = arg.month;
  const page = arg.page && arg.page > 1 ? arg.page : 1;
  const perPage = arg.per_page ?? DEFAULT_ATTENDANCE_RECORDS_PER_PAGE;

  if (
    typeof branchId !== "number" ||
    !Number.isFinite(branchId) ||
    branchId <= 0 ||
    typeof year !== "number" ||
    !Number.isFinite(year) ||
    typeof month !== "number" ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return {
    branch_id: branchId,
    year,
    month,
    per_page: perPage,
    page,
  };
}

export function serializeAttendanceRecordsParams(
  params: AttendanceRecordsQueryParams,
): string {
  return JSON.stringify({
    branch_id: params.branch_id,
    year: params.year,
    month: params.month,
    per_page: params.per_page ?? DEFAULT_ATTENDANCE_RECORDS_PER_PAGE,
    page: params.page ?? 1,
  });
}

export const {
  useGetAttendanceHistoryQuery,
  useGetAttendanceRecordsQuery,
} = attendanceApi;
