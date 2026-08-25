import { baseApi } from "@/app/store/api/baseApi";
import { fetchProfile } from "@services/auth/profileService";
import type { ProfileResult } from "@/types/ProfileApiTypes";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export const profileApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileResult, void>({
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
          const profile = await fetchProfile(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
          );
          return { data: profile };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load profile.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: [{ type: "Profile", id: "SELF" }],
    }),
  }),
});

export const { useGetProfileQuery } = profileApi;
