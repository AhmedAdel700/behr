import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { applyLangHeader } from "@services/auth/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,

    prepareHeaders: async (headers) => {
      const session = await getSession();

      headers.set("Accept", "application/json");
      applyLangHeader(headers, await getRequestLang());
      headers.delete("Accept-Language");

      if (session?.accessToken) {
        headers.set(
          "Authorization",
          `${session.tokenType} ${session.accessToken}`,
        );
      }

      return headers;
    },
  }),

  tagTypes: [
    "Branch",
    "Department",
    "Employee",
    "LeaveRequest",
    "LeaveType",
    "Position",
    "RegistrationRequest",
    "Attendance",
    "Profile",
    "LeaveBalance",
    "SystemFile",
    "Overview",
    "AttendanceImport",
  ],

  endpoints: () => ({}),
});