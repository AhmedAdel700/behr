"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Calendar, Download, Fingerprint, History, MapPinned, Search, UploadCloud } from "lucide-react";
import {
  DEFAULT_BRANCHES_LIST_PARAMS,
  useGetBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import { CustomUpload } from "@/components/shared/CustomUpload";
import { MainButton } from "@/components/shared/MainButton";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import { TablePagination } from "@/components/shared/TablePagination";
import {
  buildMonthOptions,
  buildYearOptions,
  downloadFingerprintImportUpload,
  fetchFingerprintImportMonth,
  submitFingerprintImport,
} from "@/lib/admin/fingerprintImportService";
import {
  getAllFingerprintImportMonthsSnapshot,
  getFingerprintImportMonthSnapshot,
  getFingerprintImportsVersionSnapshot,
  hydrateFingerprintImports,
  subscribeFingerprintImports,
} from "@/lib/admin/fingerprintImportStore";
import { searchFingerprintRecords } from "@/lib/admin/searchFingerprintRecords";
import { formatDateTime12, formatStoredDate, formatStoredTime12, resolveTimeLocale } from "@/lib/formatTime";
import type {
  FingerprintAttendanceStatus,
  FingerprintImportMonthData,
  FingerprintImportUpload,
} from "@/types/FingerprintImportApiTypes";
import { cn } from "@/lib/utils";
import {
  TABLE_DATE_CELL_CLASS,
  TABLE_DATE_RANGE_CELL_CLASS,
  TABLE_DATETIME_CELL_CLASS,
  TABLE_PERIOD_CELL_CLASS,
  TABLE_TIME_CELL_CLASS,
} from "@/lib/tableCells";

const RECORDS_PAGE_SIZE = 31;
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
  const [uploading, setUploading] = useState(false);
  const [monthData, setMonthData] = useState<FingerprintImportMonthData | null>(null);
  const [recordsSearchQuery, setRecordsSearchQuery] = useState("");
  const [recordsPage, setRecordsPage] = useState(1);
  const [downloadingUploadId, setDownloadingUploadId] = useState<string | null>(
    null,
  );

  const importsVersion = useSyncExternalStore(
    subscribeFingerprintImports,
    getFingerprintImportsVersionSnapshot,
    () => 0
  );

  const parsedUploadYear = Number(uploadYear);
  const parsedUploadMonth = Number(uploadMonth);
  const parsedViewYear = Number(viewYear);
  const parsedViewMonth = Number(viewMonth);

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
  };

  const handleViewYearChange = (value: string): void => {
    setViewYear(value);
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

  const historyUploads = useMemo(() => {
    if (!viewBranchId.trim()) {
      return [];
    }

    return getAllFingerprintImportMonthsSnapshot(viewBranchId)
      .filter((item) => item.year === parsedViewYear)
      .flatMap((item) => item.uploads)
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      );
  }, [importsVersion, parsedViewYear, viewBranchId]);

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

  const handleDownloadUpload = async (upload: FingerprintImportUpload): Promise<void> => {
    setDownloadingUploadId(upload.id);

    const response = await downloadFingerprintImportUpload(viewBranchId, upload);

    if (!response.ok) {
      toast.error(response.message);
    }

    setDownloadingUploadId(null);
  };

  const handleUpload = async (): Promise<void> => {
    if (!uploadBranchId.trim()) {
      setUploadError(t("errors.noBranch"));
      return;
    }

    if (!selectedFile) {
      setUploadError(t("errors.noFile"));
      return;
    }

    setUploading(true);
    setUploadError(null);

    const response = await submitFingerprintImport({
      branchId: uploadBranchId,
      file: selectedFile,
      year: parsedUploadYear,
      month: parsedUploadMonth,
    });

    if (response.ok) {
      setViewBranchId(uploadBranchId);
      setViewYear(uploadYear);
      setViewMonth(uploadMonth);
      setMonthData(response.data);
      setSelectedFile(undefined);
    } else {
      setUploadError(response.message);
    }

    setUploading(false);
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
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
            <Fingerprint className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">{t("uploadSectionTitle")}</h2>
            <p className="text-sm text-text-secondary">{t("uploadSectionSubtitle")}</p>
          </div>
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
            }}
            error={uploadError ?? undefined}
            disabled={uploading || loadingMonth || !uploadBranchId.trim()}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <MainButton
            variant="primary"
            startIcon={<UploadCloud className="size-4" />}
            loading={uploading}
            disabled={
              !uploadBranchId.trim() ||
              !selectedFile ||
              uploading ||
              loadingMonth
            }
            onClick={() => {
              void handleUpload();
            }}
          >
            {t("upload.submit")}
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

      <section className="space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-text-muted" aria-hidden />
            <h2 className="text-sm font-semibold text-ink">
              {t("historyTitle", { count: historyUploads.length })}
            </h2>
          </div>
          {historyViewFilters}
        </div>

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
                    {t("historyColumns.uploadedBy")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("historyColumns.recordCount")}
                  </th>
                  <th className="px-4 py-4 text-end text-xs font-semibold text-text-muted">
                    {t("historyColumns.download")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {historyUploads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">
                      {viewBranchId.trim() ? t("historyEmpty") : t("historySelectBranch")}
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
                          new Date(upload.uploadedAt),
                          resolveTimeLocale(locale)
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{upload.uploadedBy}</td>
                      <td className="px-4 py-3 tabular-nums text-text-secondary">
                        {upload.recordCount}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <MainButton
                          variant="edit-soft"
                          size="sm"
                          iconOnly
                          aria-label={t("historyDownload", { fileName: upload.fileName })}
                          startIcon={<Download className="size-4" />}
                          loading={downloadingUploadId === upload.id}
                          disabled={
                            !viewBranchId.trim() ||
                            (downloadingUploadId !== null &&
                              downloadingUploadId !== upload.id)
                          }
                          onClick={() => {
                            void handleDownloadUpload(upload);
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <MainSelect
              label={t("filters.branch")}
              value={viewBranchId}
              onValueChange={handleViewBranchChange}
              options={branchOptions}
              placeholder={t("placeholders.branch")}
              startIcon={<MapPinned className="size-4" />}
              disabled={isLoadingBranches || branchOptions.length === 0}
            />
          </div>
          <div className="w-full sm:max-w-xs">
            <MainInput
              type="search"
              value={recordsSearchQuery}
              onChange={(event) => handleRecordsSearchChange(event.target.value)}
              placeholder={t("recordsSearchPlaceholder")}
              startIcon={<Search />}
              aria-label={t("recordsSearchPlaceholder")}
              disabled={!viewBranchId.trim()}
            />
          </div>
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
