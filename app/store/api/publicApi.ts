import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "cookies-next";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

export const publicApi = createApi({
  reducerPath: "publicApi",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,

    prepareHeaders: async (headers) => {
      const locale = await getCookie("NEXT_LOCALE");

      headers.set("Accept", "application/json");
      headers.set("lang", String(locale || "ar"));

      return headers;
    },
  }),

  tagTypes: ["PublicBranch", "PublicDepartment", "PublicJobPosition"],

  endpoints: () => ({}),
});
