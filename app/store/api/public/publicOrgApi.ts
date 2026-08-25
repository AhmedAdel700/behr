import { publicApi } from "@/app/store/api/publicApi";
import type {
  PublicNamedRecord,
  RegisterPayload,
  RegisterResult,
} from "@/types/PublicOrgApiTypes";
import { RegisterApiError } from "@/types/PublicOrgApiTypes";
import { registerWithDetails } from "@services/auth/registerService";
import {
  fetchPublicBranchDepartments,
  fetchPublicBranches,
  parsePublicNamedList,
} from "@services/public/publicOrgService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";

export const publicOrgApi = publicApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicBranches: builder.query<PublicNamedRecord[], void>({
      async queryFn() {
        try {
          const data = await fetchPublicBranches(await getRequestLang());
          return { data };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load branches.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: [{ type: "PublicBranch", id: "LIST" }],
    }),
    getPublicBranchDepartments: builder.query<PublicNamedRecord[], string>({
      async queryFn(branchId) {
        try {
          const data = await fetchPublicBranchDepartments(
            await getRequestLang(),
            branchId,
          );
          return { data };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load departments.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (_result, _error, branchId) => [
        { type: "PublicDepartment", id: branchId },
      ],
    }),
    getPublicJobPositions: builder.query<PublicNamedRecord[], void>({
      query: () => "/public/job-positions",
      transformResponse: (payload: unknown): PublicNamedRecord[] =>
        parsePublicNamedList(payload, "Failed to load job positions."),
      providesTags: [{ type: "PublicJobPosition", id: "LIST" }],
    }),
    registerAccount: builder.mutation<RegisterResult, RegisterPayload>({
      async queryFn(body) {
        try {
          const data = await registerWithDetails(body, await getRequestLang());
          return { data };
        } catch (error) {
          if (error instanceof RegisterApiError) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: error.message,
                data: { messages: error.messages },
              },
            };
          }

          const message =
            error instanceof Error ? error.message : "Registration failed.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
    }),
  }),
});

export const {
  useGetPublicBranchesQuery,
  useGetPublicBranchDepartmentsQuery,
  useGetPublicJobPositionsQuery,
  useRegisterAccountMutation,
} = publicOrgApi;
