"use client";

import { useRef, useState, type MouseEvent, type ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Eye, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  DEFAULT_REGISTRATION_REQUESTS_LIST_PARAMS,
  normalizeRegistrationRequestsListParams,
  registrationRequestsApi,
  useAcceptRegistrationRequestMutation,
  useGetRegistrationRequestsQuery,
  useRejectRegistrationRequestMutation,
} from "@/app/store/api/registration-requests/registrationRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { RegistrationRequestViewModal } from "@/components/admin/RegistrationRequestViewModal";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { MainButton } from "@/components/shared/MainButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import { TABLE_DATETIME_CELL_CLASS } from "@/lib/tableCells";
import { cn } from "@/lib/utils";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import type {
  RegistrationRequestRecord,
  RegistrationRequestsListQueryParams,
  RegistrationRequestsListResult,
} from "@/types/RegistrationRequestsApiTypes";

function formatSubmittedAt(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime12(date, resolveTimeLocale(locale));
}

export function AdminRegistrationsPage({
  initialData,
}: {
  initialData?: RegistrationRequestsListResult;
}): ReactElement {
  const t = useTranslations("admin.registrations");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const { triggerRef: viewRegistrationTriggerRef, bindTrigger: bindViewRegistrationTrigger } =
    useModalTriggerRef();
  const { triggerRef: approveRegistrationTriggerRef, bindTrigger: bindApproveRegistrationTrigger } =
    useModalTriggerRef();
  const { triggerRef: rejectRegistrationTriggerRef, bindTrigger: bindRejectRegistrationTrigger } =
    useModalTriggerRef();

  const queryArg: RegistrationRequestsListQueryParams =
    normalizeRegistrationRequestsListParams({
      page,
      search: searchQuery,
      status: "pending",
    });

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      registrationRequestsApi.util.upsertQueryData(
        "getRegistrationRequests",
        DEFAULT_REGISTRATION_REQUESTS_LIST_PARAMS,
        initialData,
      ),
    );
  }

  const {
    data: requestsResult,
    isLoading,
    isFetching,
  } = useGetRegistrationRequestsQuery(queryArg);
  const [acceptRegistration, { isLoading: accepting }] =
    useAcceptRegistrationRequestMutation();
  const [rejectRegistration, { isLoading: rejecting }] =
    useRejectRegistrationRequestMutation();

  const requests = requestsResult?.requests ?? initialData?.requests ?? [];
  const meta = requestsResult?.meta ?? initialData?.meta;
  const pending = requests.filter((item) => item.status === "pending");

  const approveRequest = approveId
    ? pending.find((item) => item.id === approveId) ?? null
    : null;
  const rejectRequest = rejectId
    ? pending.find((item) => item.id === rejectId) ?? null
    : null;

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setPage(1);
  };

  const openView = (
    request: RegistrationRequestRecord,
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    bindViewRegistrationTrigger(event);
    setViewId(request.id);
  };

  const confirmApprove = async (): Promise<void> => {
    if (!approveId) {
      return;
    }

    try {
      const result = await acceptRegistration({ requestId: approveId }).unwrap();
      toast.success(result.message || t("approveConfirm"));
      setApproveId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("reviewError");
      toast.error(message);
    }
  };

  const confirmReject = async (): Promise<void> => {
    if (!rejectId) {
      return;
    }

    try {
      const result = await rejectRegistration({ requestId: rejectId }).unwrap();
      toast.success(result.message || t("rejectConfirm"));
      setRejectId(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("reviewError");
      toast.error(message);
    }
  };

  const isInitialQuery = page === 1 && searchQuery.trim().length === 0;
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
              onSearch={handleSearch}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <h2 className="self-end text-sm font-semibold text-ink lg:self-auto">
            {t("pendingTitle", { count: meta?.total ?? pending.length })}
          </h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.name")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.contact")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.fingerprint")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.position")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.department")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.branch")}
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
                  <TableSkeleton columnCount={8} />
                ) : pending.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {searchQuery.trim()
                        ? t("noSearchResults")
                        : t("emptyPending")}
                    </td>
                  </tr>
                ) : (
                  pending.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 text-start">
                        <p className="font-medium text-ink">{request.name}</p>
                      </td>
                      <td className="px-4 py-3 text-start">
                        <p className="text-ink">{request.email}</p>
                        <p className="text-xs text-text-muted">{request.phone || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-start text-xs font-mono tabular-nums text-text-secondary">
                        {request.fingerprintNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {request.positionName || "—"}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {request.departmentName || "—"}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {request.branchName || "—"}
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
                          <MainButton
                            variant="add-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("approve")}
                            startIcon={<Check className="size-4" />}
                            onClick={(event) => {
                              bindApproveRegistrationTrigger(event);
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
                              bindRejectRegistrationTrigger(event);
                              setRejectId(request.id);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
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

      <RegistrationRequestViewModal
        requestId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
        triggerRef={viewRegistrationTriggerRef}
      />

      <DeleteConfirmModal
        open={approveRequest !== null}
        title={t("approveTitle")}
        description={
          approveRequest
            ? t("approveDescription", { name: approveRequest.name })
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
        loading={accepting}
        triggerRef={approveRegistrationTriggerRef}
      />

      <DeleteConfirmModal
        open={rejectRequest !== null}
        title={t("rejectTitle")}
        description={
          rejectRequest
            ? t("rejectDescription", { name: rejectRequest.name })
            : ""
        }
        confirmLabel={t("rejectConfirm")}
        cancelLabel={t("cancel")}
        confirmVariant="delete-soft"
        onCancel={() => setRejectId(null)}
        onConfirm={() => {
          void confirmReject();
          return false;
        }}
        loading={rejecting}
        triggerRef={rejectRegistrationTriggerRef}
      />
    </div>
  );
}
