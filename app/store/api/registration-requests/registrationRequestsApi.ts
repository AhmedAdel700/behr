import { baseApi } from "@/app/store/api/baseApi";
import type {
  RegistrationRequestRecord,
  RegistrationRequestsListQueryParams,
  RegistrationRequestsListResult,
  RegistrationReviewResult,
  RejectRegistrationPayload,
} from "@/types/RegistrationRequestsApiTypes";
import {
  acceptRegistrationRequest as acceptRegistrationRequestCall,
  fetchRegistrationRequestById,
  fetchRegistrationRequests,
  rejectRegistrationRequest as rejectRegistrationRequestCall,
} from "@services/registration-requests/registrationRequestsService";
import { getCookie } from "cookies-next";
import { getSession } from "next-auth/react";

interface ReviewRegistrationArgs {
  requestId: string;
}

interface RejectRegistrationArgs {
  requestId: string;
  body?: RejectRegistrationPayload;
}

async function getLang(): Promise<string> {
  const localeCookie = await getCookie("NEXT_LOCALE");
  return typeof localeCookie === "string" ? localeCookie : "ar";
}

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export function normalizeRegistrationRequestsListParams(
  arg?: RegistrationRequestsListQueryParams | void,
): RegistrationRequestsListQueryParams {
  const page = arg?.page && arg.page > 1 ? arg.page : 1;
  const search = arg?.search?.trim();
  const status = arg?.status;

  return {
    page,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
  };
}

export function serializeRegistrationRequestsListParams(
  params: RegistrationRequestsListQueryParams,
): string {
  return JSON.stringify({
    page: params.page ?? 1,
    search: params.search?.trim() ?? "",
    status: params.status ?? "",
  });
}

export const DEFAULT_REGISTRATION_REQUESTS_LIST_PARAMS: RegistrationRequestsListQueryParams =
  {
    page: 1,
    status: "pending",
  };

export const registrationRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRegistrationRequests: builder.query<
      RegistrationRequestsListResult,
      RegistrationRequestsListQueryParams | void
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
          const result = await fetchRegistrationRequests(
            session.accessToken,
            await getLang(),
            getTokenType(session.tokenType),
            normalizeRegistrationRequestsListParams(arg),
          );

          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load registration requests.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${serializeRegistrationRequestsListParams(
          normalizeRegistrationRequestsListParams(queryArgs),
        )})`,
      providesTags: (result) =>
        result
          ? [
              ...result.requests.map((request) => ({
                type: "RegistrationRequest" as const,
                id: request.id,
              })),
              { type: "RegistrationRequest", id: "LIST" },
            ]
          : [{ type: "RegistrationRequest", id: "LIST" }],
    }),
    getRegistrationRequestById: builder.query<RegistrationRequestRecord, string>({
      async queryFn(requestId) {
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
          const request = await fetchRegistrationRequestById(
            session.accessToken,
            await getLang(),
            requestId,
            getTokenType(session.tokenType),
          );
          return { data: request };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load registration request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: (_result, _error, requestId) => [
        { type: "RegistrationRequest", id: requestId },
      ],
    }),
    acceptRegistrationRequest: builder.mutation<
      RegistrationReviewResult,
      ReviewRegistrationArgs
    >({
      async queryFn({ requestId }) {
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
          const result = await acceptRegistrationRequestCall(
            session.accessToken,
            await getLang(),
            requestId,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to accept registration request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "RegistrationRequest", id: args.requestId },
        { type: "RegistrationRequest", id: "LIST" },
      ],
    }),
    rejectRegistrationRequest: builder.mutation<
      RegistrationReviewResult,
      RejectRegistrationArgs
    >({
      async queryFn({ requestId, body }) {
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
          const result = await rejectRegistrationRequestCall(
            session.accessToken,
            await getLang(),
            requestId,
            body,
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to reject registration request.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: "RegistrationRequest", id: args.requestId },
        { type: "RegistrationRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetRegistrationRequestsQuery,
  useGetRegistrationRequestByIdQuery,
  useAcceptRegistrationRequestMutation,
  useRejectRegistrationRequestMutation,
} = registrationRequestsApi;
