"use client";

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Calendar, Download, Eye, Fingerprint, History, MapPinned, Search } from "lucide-react";
import {
  DEFAULT_BRANCHES_LIST_PARAMS,
  useGetBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import {
  attendanceImportApi,
  useGetAttendanceImportHistoryQuery,
} from "@/app/store/api/imports/attendanceImportApi";
import type { AppDispatch } from "@/app/store/store";
import { CustomUpload } from "@/components/shared/CustomUpload";
import { MainButton } from "@/components/shared/MainButton";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import { TablePagination } from "@/components/shared/TablePagination";
import { AttendanceImportPreviewModal } from "@/components/admin/AttendanceImportPreviewModal";
import { previewAttendanceImportClient, confirmAttendanceImportClient } from "@/lib/admin/attendanceImportClient";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import {
  buildMonthOptions,
  buildYearOptions,
  fetchFingerprintImportMonth,
} from "@/lib/admin/fingerprintImportService";
import {
  getFingerprintImportMonthSnapshot,
  hydrateFingerprintImports,
} from "@/lib/admin/fingerprintImportStore";
import { searchFingerprintRecords } from "@/lib/admin/searchFingerprintRecords";
import { formatDateTime12, formatStoredDate, formatStoredTime12, resolveTimeLocale } from "@/lib/formatTime";
import {
  downloadSystemFileByType,
  ATTENDANCE_IMPORT_TEMPLATE_FILE_NAME,
  ATTENDANCE_IMPORT_TEMPLATE_TYPE,
} from "@/lib/admin/systemFileDownload";
import { cn } from "@/lib/utils";
import type { AttendanceImportHistoryRecord, AttendanceImportPreviewResult } from "@/types/AttendanceImportApiTypes";
import type {
  FingerprintAttendanceStatus,
  FingerprintImportMonthData,
} from "@/types/FingerprintImportApiTypes";
import {
  TABLE_DATE_CELL_CLASS,
  TABLE_DATE_RANGE_CELL_CLASS,
  TABLE_DATETIME_CELL_CLASS,
  TABLE_PERIOD_CELL_CLASS,
  TABLE_TIME_CELL_CLASS,
} from "@/lib/tableCells";

const RECORDS_PAGE_SIZE = 31;
const HISTORY_PAGE_SIZE = 15;
const RECORDS_COLUMN_COUNT = 8;
const recordsTableHeaderClass =
  "whitespace-nowrap px-4 py-4 text-start text-xs font-semibold text-text-muted";
const recordsTableCellClass = "whitespace-nowrap px-4 py-3 text-start";

const attendanceStatusSurface: Record<
  FingerprintAttendanceStatus,
  string
> = {
  in: "bg-brand-50 text-brand-800",
  out: "bg-neutral-100 text-neutral-700",
  in_out: "bg-jade-50 text-jade-800",
};

export function AdminFingerprintImportPage(): ReactElement {
  const t = useTranslations("admin.fingerprintImportPage");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const now = new Date();

  const [uploadYear, setUploadYear] = useState(String(now.getFullYear()));
  const [uploadMonth, setUploadMonth] = useState(String(now.getMonth() + 1));
  const [uploadBranchId, setUploadBranchId] = useState("");
  const [viewYear, setViewYear] = useState(String(now.getFullYear()));
  const [viewMonth, setViewMonth] = useState(String(now.getMonth() + 1));
  const [viewBranchId, setViewBranchId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [previewResult, setPreviewResult] =
    useState<AttendanceImportPreviewResult | null>(null);
  const [monthData, setMonthData] = useState<FingerprintImportMonthData | null>(null);
  const [recordsSearchQuery, setRecordsSearchQuery] = useState("");
  const [recordsPage, setRecordsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [downloadingGuide, setDownloadingGuide] = useState(false);
  const { triggerRef: previewTriggerRef, bindTrigger: bindPreviewTrigger } =
    useModalTriggerRef();

  const parsedUploadYear = Number(uploadYear);
  const parsedUploadMonth = Number(uploadMonth);
  const parsedViewYear = Number(viewYear);
  const parsedViewMonth = Number(viewMonth);

  const historyQueryArg = useMemo(
    () =>
      viewBranchId.trim() && Number.isFinite(parsedViewYear)
        ? {
            branch_id: viewBranchId.trim(),
            year: parsedViewYear,
            page: historyPage,
          }
        : undefined,
    [historyPage, parsedViewYear, viewBranchId],
  );

  const {
    data: historyResult,
    isFetching: loadingHistory,
    isError: historyError,
    error: historyQueryError,
  } = useGetAttendanceImportHistoryQuery(historyQueryArg, {
    skip: !historyQueryArg,
  });

  const { data: branchesResult, isLoading: isLoadingBranches } =
    useGetBranchesQuery(DEFAULT_BRANCHES_LIST_PARAMS);
  const branches = branchesResult?.branches ?? [];

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: branch.city ? `${branch.name} · ${branch.city}` : branch.name,
      })),
    [branches],
  );

  const handleViewBranchChange = (value: string): void => {
    setViewBranchId(value);
    setMonthData(null);
    setFetchError(null);
    setHistoryPage(1);
  };

  const handleViewYearChange = (value: string): void => {
    setViewYear(value);
    setMonthData(null);
    setFetchError(null);
    setHistoryPage(1);
  };

  const handleViewMonthChange = (value: string): void => {
    setViewMonth(value);
    setMonthData(null);
    setFetchError(null);
  };

  const yearOptions = useMemo(
    () =>
      buildYearOptions(now.getFullYear()).map((value) => ({
        value: String(value),
        label: String(value),
      })),
    [now]
  );

  const monthOptions = useMemo(
    () =>
      buildMonthOptions().map((value) => ({
        value: String(value),
        label: t(`months.${value}` as "months.1"),
      })),
    [t]
  );

  useEffect(() => {
    setPreviewResult(null);
  }, [selectedFile, uploadBranchId, uploadYear, uploadMonth]);

  const loadMonthData = useCallback(async (): Promise<void> => {
    if (
      !viewBranchId.trim() ||
      !Number.isFinite(parsedViewYear) ||
      !Number.isFinite(parsedViewMonth)
    ) {
      return;
    }

    setLoadingMonth(true);
    setFetchError(null);

    const response = await fetchFingerprintImportMonth(
      viewBranchId,
      parsedViewYear,
      parsedViewMonth,
    );

    if (response.ok) {
      setMonthData(response.data);
    } else {
      setFetchError(response.message);
      setMonthData(
        getFingerprintImportMonthSnapshot(
          viewBranchId,
          parsedViewYear,
          parsedViewMonth,
        ),
      );
    }

    setLoadingMonth(false);
  }, [parsedViewMonth, parsedViewYear, viewBranchId]);

  useEffect(() => {
    hydrateFingerprintImports();
  }, []);

  useEffect(() => {
    void loadMonthData();
  }, [loadMonthData]);

  useEffect(() => {
    setRecordsSearchQuery("");
    setRecordsPage(1);
  }, [viewBranchId, parsedViewYear, parsedViewMonth]);

  useEffect(() => {
    if (monthData || !viewBranchId.trim()) return;
    setMonthData(
      getFingerprintImportMonthSnapshot(
        viewBranchId,
        parsedViewYear,
        parsedViewMonth,
      ),
    );
  }, [monthData, parsedViewMonth, parsedViewYear, viewBranchId]);

  const records = monthData?.records ?? [];

  const historyUploads = historyResult?.items ?? [];
  const historyTotalItems = historyResult?.meta.total ?? historyUploads.length;
  const historyTotalPages = Math.max(1, historyResult?.meta.last_page ?? 1);
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  const historyLoadErrorMessage = useMemo((): string => {
    if (
      typeof historyQueryError === "object" &&
      historyQueryError !== null &&
      "error" in historyQueryError &&
      typeof historyQueryError.error === "string" &&
      historyQueryError.error.trim()
    ) {
      return historyQueryError.error;
    }

    return t("historyLoadError");
  }, [historyQueryError, t]);

  const filteredRecords = useMemo(
    () => searchFingerprintRecords(records, recordsSearchQuery),
    [records, recordsSearchQuery]
  );

  const recordsTotalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / RECORDS_PAGE_SIZE)
  );
  const safeRecordsPage = Math.min(recordsPage, recordsTotalPages);

  const pagedRecords = useMemo(() => {
    const start = (safeRecordsPage - 1) * RECORDS_PAGE_SIZE;
    return filteredRecords.slice(start, start + RECORDS_PAGE_SIZE);
  }, [filteredRecords, safeRecordsPage]);

  const recordsEmptyMessage = !viewBranchId.trim()
    ? t("recordsSelectBranch")
    : records.length === 0
      ? t("recordsEmpty")
      : t("recordsNoResults");

  const handleRecordsSearchChange = (value: string): void => {
    setRecordsSearchQuery(value);
    setRecordsPage(1);
  };

  const handleDownloadGuide = async (): Promise<void> => {
    setDownloadingGuide(true);

    try {
      const result = await downloadSystemFileByType(
        ATTENDANCE_IMPORT_TEMPLATE_TYPE,
        ATTENDANCE_IMPORT_TEMPLATE_FILE_NAME,
      );

      if (result.ok) {
        toast.success(t("downloadGuideSuccess"));
        return;
      }

      toast.error(result.message || t("downloadGuideError"));
    } finally {
      setDownloadingGuide(false);
    }
  };

  const handlePreview = async (): Promise<void> => {
    if (!uploadBranchId.trim()) {
      setUploadError(t("errors.noBranch"));
      return;
    }

    if (!selectedFile) {
      setUploadError(t("errors.noFile"));
      return;
    }

    setPreviewing(true);
    setUploadError(null);

    const response = await previewAttendanceImportClient({
      branchId: uploadBranchId,
      file: selectedFile,
      year: parsedUploadYear,
      month: parsedUploadMonth,
    });

    if (response.ok) {
      setPreviewResult(response.data);
      toast.success(response.data.message || t("preview.success"));
    } else {
      setPreviewResult(null);
      setUploadError(response.message);
      toast.error(response.message || t("preview.error"));
    }

    setPreviewing(false);
  };

  const closePreview = (): void => {
    if (confirming) {
      return;
    }

    setPreviewResult(null);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!previewResult?.importToken.trim()) {
      return;
    }

    setConfirming(true);

    const response = await confirmAttendanceImportClient(
      previewResult.importToken,
    );

    if (response.ok) {
      toast.success(response.data.message || t("preview.confirmSuccess"));
      setPreviewResult(null);
      setSelectedFile(undefined);
      setUploadError(null);
      setViewBranchId(uploadBranchId);
      setViewYear(uploadYear);
      setViewMonth(uploadMonth);
      dispatch(
        attendanceImportApi.util.invalidateTags([
          { type: "AttendanceImport", id: "HISTORY" },
        ]),
      );

      const monthResponse = await fetchFingerprintImportMonth(
        uploadBranchId,
        parsedUploadYear,
        parsedUploadMonth,
      );

      if (monthResponse.ok) {
        setMonthData(monthResponse.data);
        setFetchError(null);
      } else {
        setFetchError(monthResponse.message);
      }
    } else {
      toast.error(response.message || t("preview.confirmError"));
    }

    setConfirming(false);
  };

  const historyViewFilters = (
    <div className="grid gap-3 sm:grid-cols-2">
      <MainSelect
        label={t("filters.branch")}
        value={viewBranchId}
        onValueChange={handleViewBranchChange}
        options={branchOptions}
        placeholder={t("placeholders.branch")}
        startIcon={<MapPinned className="size-4" />}
        disabled={isLoadingBranches || branchOptions.length === 0}
      />
      <MainSelect
        label={t("fields.year")}
        value={viewYear}
        onValueChange={handleViewYearChange}
        options={yearOptions}
        placeholder={t("placeholders.year")}
        startIcon={<Calendar className="size-4" />}
        disabled={loadingMonth || !viewBranchId.trim()}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-xs sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <Fingerprint className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">{t("uploadSectionTitle")}</h2>
              <p className="text-sm text-text-secondary">{t("uploadSectionSubtitle")}</p>
            </div>
          </div>
          <MainButton
            type="button"
            variant="primary"
            size="sm"
            loading={downloadingGuide}
            disabled={downloadingGuide}
            startIcon={<Download className="size-4" />}
            className="shrink-0 self-start"
            onClick={() => {
              void handleDownloadGuide();
            }}
          >
            {downloadingGuide ? t("downloadingGuide") : t("downloadGuide")}
          </MainButton>
        </div>

        <div className="space-y-4">
          <MainSelect
            label={t("filters.branch")}
            value={uploadBranchId}
            onValueChange={(value) => {
              setUploadBranchId(value);
              setUploadError(null);
            }}
            options={branchOptions}
            placeholder={t("placeholders.branch")}
            hint={t("upload.branchRequiredHint")}
            startIcon={<MapPinned className="size-4" />}
            disabled={isLoadingBranches || branchOptions.length === 0}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <MainSelect
              label={t("fields.year")}
              value={uploadYear}
              onValueChange={setUploadYear}
              options={yearOptions}
              startIcon={<Calendar className="size-4" />}
            />
            <MainSelect
              label={t("fields.month")}
              value={uploadMonth}
              onValueChange={setUploadMonth}
              options={monthOptions}
              startIcon={<Calendar className="size-4" />}
            />
          </div>
        </div>

        {branchOptions.length === 0 && !isLoadingBranches ? (
          <p className="mt-3 text-sm text-text-muted">{t("noBranches")}</p>
        ) : null}

        <div className="mt-5">
          <CustomUpload
            label={t("fields.file")}
            hint={t("fields.fileHint")}
            dropLabel={t("upload.dropLabel")}
            browseLabel={t("upload.browseLabel")}
            supportedFormatsLabel={t("upload.supportedFormats")}
            removeLabel={t("upload.removeFile")}
            value={selectedFile}
            onChange={(file) => {
              setSelectedFile(file);
              setUploadError(null);
              setPreviewResult(null);
            }}
            error={uploadError ?? undefined}
            disabled={previewing || loadingMonth || !uploadBranchId.trim()}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <MainButton
            variant="primary"
            startIcon={<Eye className="size-4" />}
            loading={previewing}
            disabled={
              !uploadBranchId.trim() ||
              !selectedFile ||
              previewing ||
              loadingMonth
            }
            onClick={(event) => {
              bindPreviewTrigger(event);
              void handlePreview();
            }}
          >
            {previewing ? t("upload.previewing") : t("upload.preview")}
          </MainButton>
          {loadingMonth ? (
            <p className="text-sm text-text-muted">{t("loadingMonth")}</p>
          ) : null}
        </div>

        {fetchError ? (
          <p className="mt-3 text-sm text-danger-600" role="alert">
            {fetchError}
          </p>
        ) : null}
      </section>

      <AttendanceImportPreviewModal
        open={previewResult !== null}
        preview={previewResult}
        confirming={confirming}
        onClose={closePreview}
        onConfirm={() => {
          void handleConfirm();
        }}
        triggerRef={previewTriggerRef}
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-text-muted" aria-hidden />
            <h2 className="text-sm font-semibold text-ink">
              {t("historyTitle", { count: historyTotalItems })}
            </h2>
          </div>
          {historyViewFilters}
        </div>

        {loadingHistory ? (
          <p className="text-sm text-text-muted">{t("loadingHistory")}</p>
        ) : null}

        {historyError ? (
          <p className="text-sm text-danger-600" role="alert">
            {historyLoadErrorMessage}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("historyColumns.fileName")}
                  </th>
                  <th className={cn("px-4 py-4 text-start text-xs font-semibold text-text-muted", TABLE_PERIOD_CELL_CLASS)}>
                    {t("historyColumns.period")}
                  </th>
                  <th className={cn("px-4 py-4 text-start text-xs font-semibold text-text-muted", TABLE_DATETIME_CELL_CLASS)}>
                    {t("historyColumns.uploadedAt")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("historyColumns.recordCount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyUploads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-text-muted">
                      {viewBranchId.trim()
                        ? loadingHistory
                          ? t("loadingHistory")
                          : t("historyEmpty")
                        : t("historySelectBranch")}
                    </td>
                  </tr>
                ) : (
                  historyUploads.map((upload) => (
                    <tr
                      key={upload.id}
                      className={cn(
                        "border-b border-border last:border-b-0",
                        upload.year === parsedViewYear &&
                          upload.month === parsedViewMonth &&
                          "bg-primary-50/40"
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-ink">{upload.fileName}</td>
                      <td className={cn("px-4 py-3 text-text-secondary", TABLE_PERIOD_CELL_CLASS)}>
                        {t(`months.${upload.month}` as "months.1")} {upload.year}
                      </td>
                      <td className={cn("px-4 py-3 text-text-secondary", TABLE_DATETIME_CELL_CLASS)}>
                        {formatDateTime12(
                          new Date(upload.createdAt),
                          resolveTimeLocale(locale)
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-text-secondary">
                        {upload.totalRows}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={safeHistoryPage}
            pageSize={HISTORY_PAGE_SIZE}
            totalItems={historyTotalItems}
            onPageChange={setHistoryPage}
            previousLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
            formatSummary={({ start, end, total }) =>
              t("pagination.summary", { start, end, total })
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-ink">
          {t("recordsTitle", {
            count: filteredRecords.length,
            month: t(`months.${parsedViewMonth}` as "months.1"),
            year: parsedViewYear,
          })}
        </p>

        <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MainSelect
            label={t("filters.branch")}
            value={viewBranchId}
            onValueChange={handleViewBranchChange}
            options={branchOptions}
            placeholder={t("placeholders.branch")}
            startIcon={<MapPinned className="size-4" />}
            disabled={isLoadingBranches || branchOptions.length === 0}
          />
          <MainSelect
            label={t("fields.year")}
            value={viewYear}
            onValueChange={handleViewYearChange}
            options={yearOptions}
            placeholder={t("placeholders.year")}
            startIcon={<Calendar className="size-4" />}
            disabled={loadingMonth || !viewBranchId.trim()}
          />
          <MainSelect
            label={t("fields.month")}
            value={viewMonth}
            onValueChange={handleViewMonthChange}
            options={monthOptions}
            startIcon={<Calendar className="size-4" />}
            disabled={loadingMonth || !viewBranchId.trim()}
          />
          <MainInput
            type="search"
            label={t("filters.search")}
            value={recordsSearchQuery}
            onChange={(event) => handleRecordsSearchChange(event.target.value)}
            placeholder={t("recordsSearchPlaceholder")}
            startIcon={<Search />}
            disabled={!viewBranchId.trim()}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible -mx-px overflow-x-auto">
            <table className="w-full min-w-[68rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className={recordsTableHeaderClass}>
                    {t("recordsColumns.name")}
                  </th>
                  <th className={recordsTableHeaderClass}>
                    {t("recordsColumns.phoneNumber")}
                  </th>
                  <th className={recordsTableHeaderClass}>
                    {t("recordsColumns.fingerprintId")}
                  </th>
                  <th className={recordsTableHeaderClass}>
                    {t("recordsColumns.fingerprintSerial")}
                  </th>
                  <th className={cn(recordsTableHeaderClass, TABLE_TIME_CELL_CLASS)}>
                    {t("recordsColumns.clockIn")}
                  </th>
                  <th className={cn(recordsTableHeaderClass, TABLE_TIME_CELL_CLASS)}>
                    {t("recordsColumns.clockOut")}
                  </th>
                  <th className={cn(recordsTableHeaderClass, TABLE_DATE_CELL_CLASS)}>
                    {t("recordsColumns.date")}
                  </th>
                  <th className={recordsTableHeaderClass}>
                    {t("recordsColumns.attendanceStatus")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={RECORDS_COLUMN_COUNT} className="px-4 py-10 text-center text-sm text-text-muted">
                      {recordsEmptyMessage}
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border last:border-b-0">
                      <td className={cn(recordsTableCellClass, "font-medium text-ink")} title={record.name ?? undefined}>
                        {record.name ?? t("recordsUnknownEmployee")}
                      </td>
                      <td className={cn(recordsTableCellClass, "tabular-nums text-text-secondary")} title={record.phoneNumber ?? undefined}>
                        {record.phoneNumber ?? "—"}
                      </td>
                      <td className={cn(recordsTableCellClass, "tabular-nums text-text-secondary")} title={record.fingerprintId}>
                        {record.fingerprintId}
                      </td>
                      <td className={cn(recordsTableCellClass, "tabular-nums text-text-secondary")} title={record.fingerprintSerial ?? undefined}>
                        {record.fingerprintSerial ?? "—"}
                      </td>
                      <td className={cn(recordsTableCellClass, TABLE_TIME_CELL_CLASS, "tabular-nums text-text-secondary")}>
                        {formatStoredTime12(record.clockIn, resolveTimeLocale(locale))}
                      </td>
                      <td className={cn(recordsTableCellClass, TABLE_TIME_CELL_CLASS, "tabular-nums text-text-secondary")}>
                        {formatStoredTime12(record.clockOut, resolveTimeLocale(locale))}
                      </td>
                      <td className={cn(recordsTableCellClass, TABLE_DATE_CELL_CLASS, "text-text-secondary")} title={record.date}>
                        {formatStoredDate(record.date, resolveTimeLocale(locale))}
                      </td>
                      <td className={recordsTableCellClass}>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            attendanceStatusSurface[record.attendanceStatus]
                          )}
                        >
                          {t(`attendanceStatus.${record.attendanceStatus}`)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={safeRecordsPage}
            pageSize={RECORDS_PAGE_SIZE}
            totalItems={filteredRecords.length}
            onPageChange={setRecordsPage}
            previousLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
            formatSummary={({ start, end, total }) =>
              t("pagination.summary", { start, end, total })
            }
          />
        </div>
      </section>
    </div>
  );
}
