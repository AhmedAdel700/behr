import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";
import { getCookie } from "cookies-next";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,

    prepareHeaders: async (headers) => {
      const locale = await getCookie("NEXT_LOCALE");
      const session = await getSession();

      headers.set("Accept", "application/json");
      headers.set("lang", String(locale || "ar"));

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
  ],

  endpoints: () => ({}),
});