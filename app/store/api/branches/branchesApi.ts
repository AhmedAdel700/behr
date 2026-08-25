import { baseApi } from "@/app/store/api/baseApi";
import {
  createBranchAction,
  deleteBranchAction,
  getBranchByIdAction,
  updateBranchAction,
} from "@/app/actions/branches/branchActions";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";
import type {
  BranchPayload,
  BranchesListQueryParams,
  BranchesListResult,
} from "@/types/BranchesApiTypes";
import { fetchBranches } from "@services/branches/branchesService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

interface BranchMutationArgs {
  body: BranchPayload;
}

interface UpdateBranchArgs extends BranchMutationArgs {
  branchId: string;
}

interface DeleteBranchArgs {
  branchId: string;
}

export function normalizeBranchesListParams(
  arg?: BranchesListQueryParams | void,
): BranchesListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  const search = arg?.search?.trim();

  return {
    page,
    ...(search ? { search } : {}),
  };
}

export function serializeBranchesListParams(
  params: BranchesListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
    search: params.search?.trim() ?? "",
  });
}

export const DEFAULT_BRANCHES_LIST_PARAMS: BranchesListQueryParams = {
  page: 1,
};

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<
      BranchesListResult,
      BranchesListQueryParams | void
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

        const lang = await getRequestLang();
        const tokenType =
          typeof session.tokenType === "string" && session.tokenType
            ? session.tokenType
            : "Bearer";

        const result = await fetchBranches(
          session.accessToken,
          lang,
          tokenType,
          normalizeBranchesListParams(arg),
        );

        return { data: { branches: result.branches, meta: result.meta } };
      },
      serializeQueryArgs: ({ queryArgs }) =>
        serializeBranchesListParams(normalizeBranchesListParams(queryArgs)),
      providesTags: (result) =>
        result
          ? [
              ...result.branches.map((branch) => ({
                type: "Branch" as const,
                id: branch.id,
              })),
              { type: "Branch", id: "LIST" },
            ]
          : [{ type: "Branch", id: "LIST" }],
    }),
    getBranchById: builder.query<AdminBranchRecord, string>({
      async queryFn(branchId) {
        const result = await getBranchByIdAction(branchId, await getRequestLang());

        if (!result.success) {
          return { error: { status: "CUSTOM_ERROR", error: result.message } };
        }

        return { data: result.branch };
      },
      providesTags: (_result, _error, branchId) => [
        { type: "Branch", id: branchId },
      ],
    }),
    createBranch: builder.mutation<AdminBranchRecord, BranchMutationArgs>({
      async queryFn({ body }) {
        const result = await createBranchAction(body, await getRequestLang());

        if (!result.success) {
          return { error: { status: "CUSTOM_ERROR", error: result.message } };
        }

        return { data: result.branch };
      },
      invalidatesTags: [{ type: "Branch", id: "LIST" }],
    }),
    updateBranch: builder.mutation<AdminBranchRecord, UpdateBranchArgs>({
      async queryFn({ branchId, body }) {
        const normalizedBranchId = branchId.trim();

        if (!normalizedBranchId) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Branch id is required.",
            },
          };
        }

        const result = await updateBranchAction(
          normalizedBranchId,
          body,
          await getRequestLang(),
        );

        if (!result.success) {
          return { error: { status: "CUSTOM_ERROR", error: result.message } };
        }

        return { data: result.branch };
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Branch", id: args.branchId },
        { type: "Branch", id: "LIST" },
      ],
    }),
    deleteBranch: builder.mutation<void, DeleteBranchArgs>({
      async queryFn({ branchId }) {
        const result = await deleteBranchAction(branchId, await getRequestLang());

        if (!result.success) {
          return { error: { status: "CUSTOM_ERROR", error: result.message } };
        }

        return { data: undefined };
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Branch", id: args.branchId },
        { type: "Branch", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchesApi;
