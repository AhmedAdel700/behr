"use client";

import { useState, type ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, UploadCloud } from "lucide-react";
import { MainButton } from "@/components/shared/MainButton";
import { downloadAttendanceImportFailedRows } from "@/lib/admin/attendanceImportDownload";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import type { AttendanceImportPreviewResult } from "@/types/AttendanceImportApiTypes";
type PreviewColumnKey =
  | "name"
  | "phoneNumber"
  | "fingerprintId"
  | "fingerprintSerial"
  | "clockIn"
  | "clockOut"
  | "date"
  | "attendanceStatus";

const PREVIEW_COLUMN_LABEL_KEYS: Partial<Record<string, PreviewColumnKey>> = {
  name: "name",
  phone_number: "phoneNumber",
  finger_id: "fingerprintId",
  finger_serial: "fingerprintSerial",
  clock_in: "clockIn",
  clock_out: "clockOut",
  date: "date",
  attendance_status: "attendanceStatus",
};

function formatPreviewExpiresAt(value: string, locale: string): string {
  if (!value.trim()) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime12(date, resolveTimeLocale(locale));
}

function formatRowIssues(
  errors: Record<string, string[]>,
  warnings: Record<string, string[]>,
): string {
  const messages: string[] = [];

  for (const [field, fieldMessages] of Object.entries(errors)) {
    for (const message of fieldMessages) {
      messages.push(`${field}: ${message}`);
    }
  }

  for (const [field, fieldMessages] of Object.entries(warnings)) {
    for (const message of fieldMessages) {
      messages.push(`${field}: ${message}`);
    }
  }

  return messages.length > 0 ? messages.join(" · ") : "—";
}

function PreviewRowsTable({
  title,
  emptyMessage,
  columns,
  rows,
  showIssues,
  headerAction,
}: {
  title: string;
  emptyMessage: string;
  columns: string[];
  rows: AttendanceImportPreviewResult["validRows"];
  showIssues: boolean;
  headerAction?: ReactElement;
}): ReactElement {
  const t = useTranslations("admin.fingerprintImportPage");
  const columnCount = showIssues ? columns.length + 2 : columns.length + 1;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {headerAction ?? null}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
        <div className="admin-scroll-visible overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60">
                <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted">
                  {t("previewColumns.row")}
                </th>
                {columns.map((column) => {
                  const labelKey = PREVIEW_COLUMN_LABEL_KEYS[column];
                  const label = labelKey
                    ? t(`recordsColumns.${labelKey}`)
                    : column.replace(/_/g, " ");

                  return (
                    <th
                      key={column}
                      className="px-4 py-3 text-start text-xs font-semibold text-text-muted"
                    >
                      {label}
                    </th>
                  );
                })}
                {showIssues ? (
                  <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted">
                    {t("previewColumns.issues")}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-4 py-8 text-center text-sm text-text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.row}-${row.isValid ? "valid" : "invalid"}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {row.row}
                    </td>
                    {columns.map((column) => (
                      <td
                        key={`${row.row}-${column}`}
                        className="max-w-[12rem] truncate px-4 py-3 text-text-secondary"
                        title={row.normalized[column] || row.data[column] || undefined}
                      >
                        {row.normalized[column] || row.data[column] || "—"}
                      </td>
                    ))}
                    {showIssues ? (
                      <td className="px-4 py-3 text-danger-700">
                        {formatRowIssues(row.errors, row.warnings)}
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AttendanceImportPreviewPanel({
  preview,
  confirming,
  onConfirm,
  onClose,
}: {
  preview: AttendanceImportPreviewResult;
  confirming: boolean;
  onConfirm: () => void;
  onClose: () => void;
}): ReactElement {
  const t = useTranslations("admin.fingerprintImportPage");
  const locale = useLocale();
  const [downloadingFailedRows, setDownloadingFailedRows] = useState(false);
  const hasInvalidRows = preview.summary.invalid > 0;

  const handleDownloadFailedRows = async (): Promise<void> => {
    setDownloadingFailedRows(true);

    try {
      const result = await downloadAttendanceImportFailedRows(
        preview.importToken,
      );

      if (result.ok) {
        toast.success(t("preview.downloadFailedRowsSuccess"));
        return;
      }

      toast.error(result.message || t("preview.downloadFailedRowsError"));
    } finally {
      setDownloadingFailedRows(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2
            id="attendance-import-preview-title"
            className="text-base font-semibold text-ink"
          >
            {t("preview.title")}
          </h2>
          <p className="text-sm text-text-secondary">{preview.message}</p>
        </div>
        <p className="text-xs text-text-muted sm:text-end">
          {t("preview.expiresAt", {
            value: formatPreviewExpiresAt(preview.expiresAt, locale),
          })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
          {t("preview.summary.total", { count: preview.summary.total })}
        </span>
        <span className="inline-flex rounded-full bg-jade-50 px-3 py-1 text-xs font-semibold text-jade-800">
          {t("preview.summary.valid", { count: preview.summary.valid })}
        </span>
        <span className="inline-flex rounded-full bg-danger-50 px-3 py-1 text-xs font-semibold text-danger-700">
          {t("preview.summary.invalid", { count: preview.summary.invalid })}
        </span>
      </div>

      {preview.warnings.length > 0 ? (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          {preview.warnings.join(" · ")}
        </div>
      ) : null}

      {hasInvalidRows ? (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          {t("preview.invalidRowsWarning", { count: preview.summary.invalid })}
        </div>
      ) : null}

      <PreviewRowsTable
        title={t("preview.invalidRowsTitle", { count: preview.invalidRows.length })}
        emptyMessage={t("preview.invalidRowsEmpty")}
        columns={preview.columns}
        rows={preview.invalidRows}
        showIssues
        headerAction={
          hasInvalidRows ? (
            <MainButton
              type="button"
              variant="primary"
              size="sm"
              loading={downloadingFailedRows}
              disabled={
                downloadingFailedRows ||
                confirming ||
                !preview.importToken.trim()
              }
              startIcon={<Download className="size-4" />}
              className="shrink-0 self-start"
              onClick={() => {
                void handleDownloadFailedRows();
              }}
            >
              {downloadingFailedRows
                ? t("preview.downloadingFailedRows")
                : t("preview.downloadFailedRows")}
            </MainButton>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <MainButton
          type="button"
          variant="primary"
          loading={confirming}
          disabled={confirming || !preview.importToken.trim()}
          startIcon={<UploadCloud className="size-4" />}
          onClick={onConfirm}
        >
          {confirming ? t("preview.confirming") : t("preview.confirm")}
        </MainButton>
        <MainButton
          type="button"
          variant="neutral"
          disabled={confirming}
          onClick={onClose}
        >
          {t("preview.cancel")}
        </MainButton>
      </div>
    </div>
  );
}
