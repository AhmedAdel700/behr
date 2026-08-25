import { baseApi } from "@/app/store/api/baseApi";
import { fetchOverview } from "@services/overview/overviewService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";
import type { OverviewResult } from "@/types/OverviewApiTypes";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export const overviewApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOverview: builder.query<OverviewResult, void>({
      async queryFn() {
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
          const overview = await fetchOverview(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
          );
          return { data: overview };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load overview.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: [{ type: "Overview", id: "SUMMARY" }],
    }),
  }),
});

export const { useGetOverviewQuery } = overviewApi;
