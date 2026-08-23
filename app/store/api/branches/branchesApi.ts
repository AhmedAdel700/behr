import { baseApi } from "@/app/store/api/baseApi";
import {
  createBranchAction,
  deleteBranchAction,
  getBranchByIdAction,
  getBranchesAction,
  updateBranchAction,
} from "@/app/actions/branches/branchActions";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";
import type { BranchPayload } from "@/types/BranchesApiTypes";
import { getCookie } from "cookies-next";

interface BranchMutationArgs {
  body: BranchPayload;
}

interface UpdateBranchArgs extends BranchMutationArgs {
  branchId: string;
}

interface DeleteBranchArgs {
  branchId: string;
}

async function getLang(): Promise<string> {
  const localeCookie = await getCookie("NEXT_LOCALE");
  return typeof localeCookie === "string" ? localeCookie : "ar";
}

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<AdminBranchRecord[], void>({
      async queryFn() {
        const result = await getBranchesAction(await getLang());

        if (!result.success) {
          return { error: { status: "CUSTOM_ERROR", error: result.message } };
        }

        return { data: result.branches };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((branch) => ({
                type: "Branch" as const,
                id: branch.id,
              })),
              { type: "Branch", id: "LIST" },
            ]
          : [{ type: "Branch", id: "LIST" }],
    }),
    getBranchById: builder.query<AdminBranchRecord, string>({
      async queryFn(branchId) {
        const result = await getBranchByIdAction(branchId, await getLang());

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
        const result = await createBranchAction(body, await getLang());

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
          await getLang(),
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
        const result = await deleteBranchAction(branchId, await getLang());

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
