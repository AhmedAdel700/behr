import { baseApi } from "@/app/store/api/baseApi";
import type {
  PositionDeleteResult,
  PositionPayload,
  PositionRecord,
  PositionsListQueryParams,
  PositionsListResult,
} from "@/types/PositionsApiTypes";
import {
  createPositionRequest,
  deletePositionRequest,
  fetchAllPositions,
  fetchPositions,
  updatePositionRequest,
} from "@services/positions/positionsService";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

interface CreatePositionArgs {
  body: PositionPayload;
}

interface UpdatePositionArgs {
  positionId: string;
  body: PositionPayload;
}

interface DeletePositionArgs {
  positionId: string;
}

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export function normalizePositionsListParams(
  arg?: PositionsListQueryParams | void,
): PositionsListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  const search = arg?.search?.trim();

  return {
    page,
    ...(search ? { search } : {}),
  };
}

export function serializePositionsListParams(
  params: PositionsListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
    search: params.search?.trim() ?? "",
  });
}

export const DEFAULT_POSITIONS_LIST_PARAMS: PositionsListQueryParams = {
  page: 1,
};

export const positionsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getPositions: builder.query<
      PositionsListResult,
      PositionsListQueryParams | void
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
          const result = await fetchPositions(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
            normalizePositionsListParams(arg),
          );

          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load positions.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs }) =>
        serializePositionsListParams(normalizePositionsListParams(queryArgs)),
      providesTags: (result) =>
        result
          ? [
              ...result.positions.map((position) => ({
                type: "Position" as const,
                id: position.id,
              })),
              { type: "Position", id: "LIST" },
            ]
          : [{ type: "Position", id: "LIST" }],
    }),
    getAllPositions: builder.query<PositionRecord[], void>({
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
          const positions = await fetchAllPositions(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
          );
          return { data: positions };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load positions.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((position) => ({
                type: "Position" as const,
                id: position.id,
              })),
              { type: "Position", id: "LIST" },
            ]
          : [{ type: "Position", id: "LIST" }],
    }),
    createPosition: builder.mutation<PositionRecord, CreatePositionArgs>({
      async queryFn({ body }) {
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
          const result = await createPositionRequest(
            session.accessToken,
            await getRequestLang(),
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.position };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create position.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "Position", id: "LIST" }],
    }),
    updatePosition: builder.mutation<PositionRecord, UpdatePositionArgs>({
      async queryFn({ positionId, body }) {
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
          const result = await updatePositionRequest(
            session.accessToken,
            await getRequestLang(),
            positionId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result.position };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update position.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Position", id: args.positionId },
        { type: "Position", id: "LIST" },
      ],
    }),
    deletePosition: builder.mutation<PositionDeleteResult, DeletePositionArgs>({
      async queryFn({ positionId }) {
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
          const result = await deletePositionRequest(
            session.accessToken,
            await getRequestLang(),
            positionId,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to delete position.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "Position", id: args.positionId },
        { type: "Position", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPositionsQuery,
  useGetAllPositionsQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
} = positionsApi;
