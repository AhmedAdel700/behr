import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { applyLangHeader } from "@services/auth/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export const publicApi = createApi({
  reducerPath: "publicApi",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,

    prepareHeaders: async (headers) => {
      headers.set("Accept", "application/json");
      applyLangHeader(headers, await getRequestLang());
      headers.delete("Accept-Language");

      return headers;
    },
  }),

  tagTypes: ["PublicBranch", "PublicDepartment", "PublicJobPosition"],

  endpoints: () => ({}),
});
