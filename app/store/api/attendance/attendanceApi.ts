import { baseApi } from "@/app/store/api/baseApi";
import { fetchAttendanceHistory } from "@services/attendance/attendanceService";
import type {
  AttendanceHistoryQueryParams,
  AttendanceHistoryResult,
} from "@/types/AttendanceApiTypes";
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
  }),
});

export const { useGetAttendanceHistoryQuery } = attendanceApi;
