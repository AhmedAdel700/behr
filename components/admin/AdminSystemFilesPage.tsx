"use client";

import { useRef, useState, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import { Download, FileSpreadsheet, FolderCog, RefreshCw, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  systemFilesApi,
  useGetSystemFilesQuery,
  useRestoreSystemFileDefaultMutation,
  useSyncSystemFilesMutation,
} from "@/app/store/api/system-files/systemFilesApi";
import type { AppDispatch } from "@/app/store/store";
import { MainButton } from "@/components/shared/MainButton";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { UploadSystemFileModal } from "@/components/admin/UploadSystemFileModal";
import { downloadSystemFile } from "@/lib/admin/systemFileDownload";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import {
  isKnownSystemFileType,
} from "@/lib/admin/systemFileDisplay";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import type { KnownSystemFileType, SystemFileRecord } from "@/types/SystemFilesApiTypes";

function formatUpdatedAt(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime12(date, resolveTimeLocale(locale));
}

function resolveSystemFileTypeLabel(
  type: string,
  translateType: (key: `types.${KnownSystemFileType}`) => string,
): string {
  if (isKnownSystemFileType(type)) {
    return translateType(`types.${type}`);
  }

  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminSystemFilesPage({
  initialData,
}: {
  initialData?: SystemFileRecord[];
}): ReactElement {
  const t = useTranslations("admin.systemFilesPage");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<SystemFileRecord | null>(null);
  const { triggerRef: uploadTriggerRef, bindTrigger: bindUploadTrigger } =
    useModalTriggerRef();
  const [restoreSystemFileDefaultMutation] =
    useRestoreSystemFileDefaultMutation();
  const [syncSystemFilesMutation, { isLoading: isSyncing }] =
    useSyncSystemFilesMutation();

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      systemFilesApi.util.upsertQueryData(
        "getSystemFiles",
        undefined,
        initialData,
      ),
    );
  }

  const {
    data: filesResult,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetSystemFilesQuery();

  const files = filesResult ?? initialData ?? [];
  const hasSeededInitialData = initialData !== undefined;
  const isTableLoading =
    (isLoading || isFetching) && !hasSeededInitialData;
  const columnCount = 3;

  const handleDownload = async (file: SystemFileRecord): Promise<void> => {
    setDownloadingId(file.id);

    try {
      const result = await downloadSystemFile(file);

      if (result.ok) {
        toast.success(t("downloadSuccess"));
        return;
      }

      toast.error(result.message || t("downloadError"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestore = async (file: SystemFileRecord): Promise<void> => {
    setRestoringId(file.id);

    try {
      await restoreSystemFileDefaultMutation({ type: file.type }).unwrap();
      toast.success(t("restoreSuccess"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("restoreError");
      toast.error(message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleSync = async (): Promise<void> => {
    try {
      const result = await syncSystemFilesMutation().unwrap();
      toast.success(result.message || t("syncSuccess"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("syncError");
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-sm font-semibold text-ink">
            {t("resultsTitle", { count: files.length })}
          </h2>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <MainButton
              type="button"
              variant="primary"
              size="sm"
              loading={isSyncing}
              disabled={isSyncing}
              startIcon={<RefreshCw className="size-4" />}
              className="shrink-0 self-start sm:self-end"
              onClick={() => {
                void handleSync();
              }}
            >
              {isSyncing ? t("syncing") : t("syncDefaults")}
            </MainButton>
            <p className="text-xs text-text-muted sm:text-end">
              {t("resultsHint")}
            </p>
          </div>
        </div>

        {isError && !files.length ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-xs">
            <p className="text-sm font-medium text-ink">{t("loadError")}</p>
            <MainButton
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                void refetch();
              }}
            >
              {t("retry")}
            </MainButton>
          </div>
        ) : isTableLoading ? (
          <TableSkeleton columnCount={columnCount} rowCount={4} />
        ) : files.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-xs">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-surface-muted text-text-muted">
              <FolderCog className="size-6" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-medium text-ink">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {t("emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
            <div className="admin-scroll-visible overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/60">
                    <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                      {t("columns.file")}
                    </th>
                    <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                      {t("columns.updated")}
                    </th>
                    <th className="px-4 py-4 text-end text-xs font-semibold text-text-muted">
                      {t("columns.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const typeLabel = resolveSystemFileTypeLabel(file.type, t);
                    const updatedLabel = file.updatedAt
                      ? formatUpdatedAt(file.updatedAt, locale)
                      : t("updatedUnknown");
                    const isDownloading = downloadingId === file.id;
                    const isRestoring = restoringId === file.id;

                    return (
                      <tr
                        key={file.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                              <FileSpreadsheet
                                className="size-5"
                                strokeWidth={1.75}
                                aria-hidden
                              />
                            </span>
                            <div className="min-w-0 space-y-1">
                              <p className="truncate font-medium text-ink">
                                {file.fileName || typeLabel}
                              </p>
                              <p className="text-xs text-text-muted">
                                {typeLabel}
                              </p>
                              {file.isCustomized ? (
                                <span className="inline-flex rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-700">
                                  {t("badges.customized")}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                                  {t("badges.default")}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-text-secondary">
                          {updatedLabel}
                        </td>
                        <td className="px-4 py-4 text-end">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <MainButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              loading={isDownloading}
                              disabled={!file.status || !file.downloadUrl.trim()}
                              startIcon={<Download className="size-4" />}
                              onClick={() => {
                                void handleDownload(file);
                              }}
                            >
                              {isDownloading ? t("downloading") : t("download")}
                            </MainButton>
                            <MainButton
                              type="button"
                              variant="primary"
                              size="sm"
                              disabled={!file.status}
                              startIcon={<Upload className="size-4" />}
                              onClick={(event) => {
                                bindUploadTrigger(event);
                                setUploadTarget(file);
                              }}
                            >
                              {t("upload")}
                            </MainButton>
                            <MainButton
                              type="button"
                              variant="neutral"
                              size="sm"
                              loading={isRestoring}
                              disabled={
                                !file.status || !file.isCustomized || isRestoring
                              }
                              startIcon={<RotateCcw className="size-4" />}
                              onClick={() => {
                                void handleRestore(file);
                              }}
                            >
                              {isRestoring ? t("restoring") : t("restore")}
                            </MainButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <UploadSystemFileModal
        open={uploadTarget !== null}
        file={uploadTarget}
        onClose={() => {
          setUploadTarget(null);
        }}
        triggerRef={uploadTriggerRef}
      />
    </div>
  );
}
