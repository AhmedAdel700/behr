"use client";

import { useMemo, useRef, useState, type MouseEvent, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Eye, X } from "lucide-react";
import {
  normalizeLeaveRequestsListParams,
  leaveRequestsApi,
  serializeLeaveRequestsListParams,
  useApproveLeaveRequestMutation,
  useGetLeaveRequestsQuery,
  useRejectLeaveRequestMutation,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { LeaveRequestViewModal } from "@/components/admin/LeaveRequestViewModal";
import { RejectLeaveRequestModal } from "@/components/admin/RejectLeaveRequestModal";
import { LeaveTypeBadge } from "@/components/employee/LeaveTypeBadge";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { MainButton } from "@/components/shared/MainButton";
import { ProfileAvatar } from "@/components/shared/AvatarUpload";
import { SearchInput } from "@/components/shared/SearchInput";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { resolveAvatarSrc } from "@/lib/employee/avatar";
import { formatLeaveRequestRange, getLeaveRequestMutationError } from "@/lib/employee/leaveRequestDisplay";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import { cn } from "@/lib/utils";
import {
  TABLE_DATE_RANGE_CELL_CLASS,
  TABLE_DATETIME_CELL_CLASS,
} from "@/lib/tableCells";
import type {
  LeaveRequestRecord,
  LeaveRequestStatus,
  LeaveRequestsListQueryParams,
  LeaveRequestsListResult,
} from "@/types/LeaveRequestsApiTypes";

function formatSubmittedAt(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime12(date, resolveTimeLocale(locale));
}

function StatusBadge({
  status,
  label,
}: {
  status: LeaveRequestStatus;
  label: string;
}): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-[6.75rem] shrink-0 items-center justify-center rounded-none px-1 text-center text-[11px] font-semibold leading-none",
        status === "pending" && "bg-warning-50 text-warning-700",
        status === "approved" && "bg-success-50 text-success-700",
        status === "rejected" && "bg-danger-50 text-danger-700",
      )}
    >
      {label}
    </span>
  );
}

function employeeNameOf(request: LeaveRequestRecord): string {
  return request.employee?.fullName?.trim() || request.employeeId;
}

type StatusFilter = "all" | LeaveRequestStatus;

function syncStatusQueryParam(status: StatusFilter): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (status === "all") {
    url.searchParams.delete("status");
  } else {
    url.searchParams.set("status", status);
  }

  window.history.replaceState(null, "", url);
}

export function AdminLeaveRequestsPage({
  initialData,
  initialStatus,
  initialSearch = "",
}: {
  initialData?: LeaveRequestsListResult;
  initialStatus?: LeaveRequestStatus;
  initialSearch?: string;
}): ReactElement {
  const t = useTranslations("admin.leaveRequests");
  const tStatus = useTranslations("employee.requests.status");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  const { triggerRef: viewRequestTriggerRef, bindTrigger: bindViewRequestTrigger } =
    useModalTriggerRef();
  const { triggerRef: approveRequestTriggerRef, bindTrigger: bindApproveRequestTrigger } =
    useModalTriggerRef();
  const { triggerRef: rejectRequestTriggerRef, bindTrigger: bindRejectRequestTrigger } =
    useModalTriggerRef();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    initialStatus ?? "all",
  );
  const [page, setPage] = useState(1);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const queryArg: LeaveRequestsListQueryParams = normalizeLeaveRequestsListParams({
    page,
    search: searchQuery,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const initialQueryArg = useMemo(
    (): LeaveRequestsListQueryParams =>
      normalizeLeaveRequestsListParams({
        page: 1,
        search: initialSearch,
        status: initialStatus,
      }),
    [initialSearch, initialStatus],
  );

  const matchesInitialQuery =
    serializeLeaveRequestsListParams(queryArg) ===
    serializeLeaveRequestsListParams(initialQueryArg);

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      leaveRequestsApi.util.upsertQueryData(
        "getLeaveRequests",
        initialQueryArg,
        initialData,
      ),
    );
  }

  const {
    data: leaveRequestsResult,
    isLoading,
    isFetching,
    isError,
  } = useGetLeaveRequestsQuery(queryArg, { refetchOnMountOrArgChange: true });
  const [approveLeaveRequest, { isLoading: approving }] =
    useApproveLeaveRequestMutation();
  const [rejectLeaveRequest, { isLoading: rejecting }] =
    useRejectLeaveRequestMutation();

  const leaveRequests = matchesInitialQuery
    ? (leaveRequestsResult?.leaveRequests ?? initialData?.leaveRequests ?? [])
    : (leaveRequestsResult?.leaveRequests ?? []);
  const meta = matchesInitialQuery
    ? (leaveRequestsResult?.meta ?? initialData?.meta)
    : leaveRequestsResult?.meta;

  const viewRequest = viewId
    ? (leaveRequests.find((item) => item.id === viewId) ?? null)
    : null;
  const approveRequest = approveId
    ? (leaveRequests.find((item) => item.id === approveId) ?? null)
    : null;
  const rejectRequest = rejectId
    ? (leaveRequests.find((item) => item.id === rejectId) ?? null)
    : null;

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleStatusFilterChange = (nextStatus: StatusFilter): void => {
    setStatusFilter(nextStatus);
    setPage(1);
    syncStatusQueryParam(nextStatus);
  };

  const statusFilters = useMemo(
    (): Array<{ value: StatusFilter; label: string }> => [
      { value: "all", label: t("filters.all") },
      { value: "pending", label: tStatus("pending") },
      { value: "approved", label: tStatus("approved") },
      { value: "rejected", label: tStatus("rejected") },
    ],
    [t, tStatus],
  );

  const emptyMessage = ((): string => {
    if (searchQuery.trim()) {
      return t("noSearchResults");
    }

    if (statusFilter !== "all") {
      return t(`empty.${statusFilter}`);
    }

    return t("emptyPending");
  })();

  const openView = (
    request: LeaveRequestRecord,
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    bindViewRequestTrigger(event);
    setViewId(request.id);
  };

  const confirmApprove = async (): Promise<void> => {
    if (!approveId) {
      return;
    }

    try {
      const result = await approveLeaveRequest({
        leaveRequestId: approveId,
      }).unwrap();
      toast.success(result.message || t("approveConfirm"));
      setApproveId(null);
    } catch (error) {
      toast.error(getLeaveRequestMutationError(error, t("reviewError")));
    }
  };

  const confirmReject = async (reason: string): Promise<void> => {
    if (!rejectId) {
      return;
    }

    try {
      const result = await rejectLeaveRequest({
        leaveRequestId: rejectId,
        body: {
          comment: reason,
          rejection_reason: reason,
        },
      }).unwrap();
      toast.success(result.message || t("rejectConfirm"));
      setRejectId(null);
    } catch (error) {
      toast.error(getLeaveRequestMutationError(error, t("reviewError")));
    }
  };

  const isInitialQuery = matchesInitialQuery && page === 1;
  const hasSeededInitialData = initialData !== undefined;
  const isTableLoading =
    (isLoading || isFetching) && !(isInitialQuery && hasSeededInitialData);

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <SearchInput
              defaultValue={initialSearch}
              onSearch={handleSearch}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <h2 className="self-end text-sm font-semibold text-ink lg:self-auto">
            {t("resultsTitle", { count: meta?.total ?? leaveRequests.length })}
          </h2>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("filters.status")}
        >
          {statusFilters.map((filter) => (
            <MainButton
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "primary" : "neutral"}
              aria-pressed={statusFilter === filter.value}
              onClick={() => handleStatusFilterChange(filter.value)}
            >
              {filter.label}
            </MainButton>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.employee")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.type")}
                  </th>
                  <th className={cn("px-4 py-4 text-start text-xs font-semibold text-text-muted", TABLE_DATE_RANGE_CELL_CLASS)}>
                    {t("columns.dates")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.status")}
                  </th>
                  <th className={cn("px-4 py-4 text-start text-xs font-semibold text-text-muted", TABLE_DATETIME_CELL_CLASS)}>
                    {t("columns.submitted")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isTableLoading ? (
                  <TableSkeleton columnCount={6} />
                ) : isError && leaveRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {t("loadError")}
                    </td>
                  </tr>
                ) : leaveRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((request) => {
                    const name = employeeNameOf(request);
                    const pending = request.status === "pending";

                    return (
                      <tr
                        key={request.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2.5">
                            <ProfileAvatar
                              src={resolveAvatarSrc(request.employee?.image)}
                              alt={name}
                              width={32}
                              height={32}
                              className="size-8 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink">{name}</p>
                              {request.employee?.email ? (
                                <p className="truncate text-xs text-text-muted">
                                  {request.employee.email}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-start">
                          <LeaveTypeBadge
                            className="h-7 w-[6.75rem] justify-center rounded-none px-1 text-center"
                            leaveTypeId={request.leaveType.id}
                            name={request.leaveType.name}
                          />
                        </td>
                        <td className={cn("px-4 py-3 text-start text-text-secondary", TABLE_DATE_RANGE_CELL_CLASS)}>
                          {formatLeaveRequestRange(
                            request.startAt,
                            request.endAt,
                            locale,
                            request.leaveType.unit,
                          )}
                        </td>
                        <td className="px-4 py-3 text-start">
                          <StatusBadge
                            status={request.status}
                            label={tStatus(request.status)}
                          />
                        </td>
                        <td className={cn("px-4 py-3 text-start text-text-secondary", TABLE_DATETIME_CELL_CLASS)}>
                          {formatSubmittedAt(request.createdAt, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-start gap-2">
                            <MainButton
                              variant="edit-soft"
                              size="sm"
                              iconOnly
                              aria-label={t("view")}
                              startIcon={<Eye className="size-4" />}
                              onClick={(event) => openView(request, event)}
                            />
                            {pending ? (
                              <>
                                <MainButton
                                  variant="add-soft"
                                  size="sm"
                                  iconOnly
                                  aria-label={t("approve")}
                                  startIcon={<Check className="size-4" />}
                                  onClick={(event) => {
                                    bindApproveRequestTrigger(event);
                                    setApproveId(request.id);
                                  }}
                                />
                                <MainButton
                                  variant="delete-soft"
                                  size="sm"
                                  iconOnly
                                  aria-label={t("reject")}
                                  startIcon={<X className="size-4" />}
                                  onClick={(event) => {
                                    bindRejectRequestTrigger(event);
                                    setRejectId(request.id);
                                  }}
                                />
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isTableLoading && meta ? (
            <TablePagination
              page={meta.current_page}
              pageSize={meta.per_page}
              totalItems={meta.total}
              onPageChange={setPage}
              previousLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
              formatSummary={({ start, end, total }) =>
                t("pagination.summary", { start, end, total })
              }
            />
          ) : null}
        </div>
      </section>

      <LeaveRequestViewModal
        requestId={viewId}
        initialRequest={viewRequest}
        open={viewId !== null}
        onClose={() => setViewId(null)}
        triggerRef={viewRequestTriggerRef}
      />

      <DeleteConfirmModal
        open={approveRequest !== null}
        title={t("approveTitle")}
        description={
          approveRequest
            ? t("approveDescription", { name: employeeNameOf(approveRequest) })
            : ""
        }
        confirmLabel={t("approveConfirm")}
        cancelLabel={t("cancel")}
        confirmVariant="add-soft"
        onCancel={() => setApproveId(null)}
        onConfirm={() => {
          void confirmApprove();
          return false;
        }}
        loading={approving}
        triggerRef={approveRequestTriggerRef}
      />

      <RejectLeaveRequestModal
        open={rejectRequest !== null}
        employeeName={rejectRequest ? employeeNameOf(rejectRequest) : ""}
        loading={rejecting}
        onCancel={() => setRejectId(null)}
        onConfirm={(reason) => {
          void confirmReject(reason);
          return false;
        }}
        triggerRef={rejectRequestTriggerRef}
      />
    </div>
  );
}
