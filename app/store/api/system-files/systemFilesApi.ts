import { baseApi } from "@/app/store/api/baseApi";
import {
  fetchSystemFiles,
  restoreSystemFileDefault,
  syncSystemFiles,
  uploadSystemFile,
} from "@services/system-files/systemFilesService";
import type {
  SystemFileRecord,
  SystemFileRestorePayload,
  SystemFileSyncResult,
  SystemFileUploadPayload,
} from "@/types/SystemFilesApiTypes";
import { getRequestLang } from "@/lib/i18n/getRequestLang";
import { getSession } from "next-auth/react";

function getTokenType(tokenType: unknown): string {
  return typeof tokenType === "string" && tokenType ? tokenType : "Bearer";
}

export const systemFilesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getSystemFiles: builder.query<SystemFileRecord[], void>({
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
          const files = await fetchSystemFiles(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
          );
          return { data: files };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load system files.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      providesTags: [{ type: "SystemFile", id: "LIST" }],
    }),
    uploadSystemFile: builder.mutation<SystemFileRecord, SystemFileUploadPayload>({
      async queryFn({ type, file }) {
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
          const record = await uploadSystemFile(
            type,
            file,
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
          );
          return { data: record };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to upload system file.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "SystemFile", id: "LIST" }],
    }),
    restoreSystemFileDefault: builder.mutation<
      SystemFileRecord,
      SystemFileRestorePayload
    >({
      async queryFn({ type }) {
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
          const record = await restoreSystemFileDefault(
            type,
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
          );
          return { data: record };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to restore system file.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "SystemFile", id: "LIST" }],
    }),
    syncSystemFiles: builder.mutation<SystemFileSyncResult, void>({
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
          const result = await syncSystemFiles(
            session.accessToken,
            await getRequestLang(),
            getTokenType(session.tokenType),
          );
          return { data: result };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to sync system files.";
          return { error: { status: "CUSTOM_ERROR", error: message } };
        }
      },
      invalidatesTags: [{ type: "SystemFile", id: "LIST" }],
    }),
  }),
});

export const {
  useGetSystemFilesQuery,
  useUploadSystemFileMutation,
  useRestoreSystemFileDefaultMutation,
  useSyncSystemFilesMutation,
} = systemFilesApi;
