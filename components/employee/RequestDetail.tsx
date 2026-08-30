"use client";

import { useRef, useState, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  leaveRequestsApi,
  useCancelLeaveRequestMutation,
  useGetLeaveRequestQuery,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { LeaveTypeBadge } from "@/components/employee/LeaveTypeBadge";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { MainButton } from "@/components/shared/MainButton";
import {
  formatLeaveRequestRange,
  getLeaveRequestMutationError,
} from "@/lib/employee/leaveRequestDisplay";
import { leaveRequestStatusBadgeClass } from "@/lib/employee/leaveRequestStatusStyles";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import {
  DISPLAY_DATE_RANGE_VALUE_CLASS,
  DISPLAY_DATETIME_VALUE_CLASS,
} from "@/lib/tableCells";
import { cn } from "@/lib/utils";
import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";

export function RequestDetail({
  id,
  initialData,
}: {
  id: string;
  initialData?: LeaveRequestRecord;
}): ReactElement {
  const t = useTranslations("employee.requests");
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const cancelRequestTriggerRef = useRef<HTMLButtonElement>(null);
  const [cancelLeaveRequest, { isLoading: cancelling }] =
    useCancelLeaveRequestMutation();

  if (initialData && id && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      leaveRequestsApi.util.upsertQueryData("getLeaveRequest", id, initialData),
    );
  }

  const {
    data: leaveRequest,
    isLoading,
    isError,
  } = useGetLeaveRequestQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });

  const item = leaveRequest ?? initialData;

  if (!id || ((isError || !item) && !isLoading)) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {t("notFoundTitle")}
        </h1>
        <p className="text-sm text-text-secondary">{t("notFoundDescription")}</p>
        <MainButton variant="primary" size="sm" link="/requests">
          {t("back")}
        </MainButton>
      </div>
    );
  }

  if (!item) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
        {t("loading")}
      </p>
    );
  }

  const submittedAt = formatTimestamp(item.createdAt, locale);
  const reviewedAt = item.reviewedAt
    ? formatTimestamp(item.reviewedAt, locale)
    : null;

  const handleCancel = async (): Promise<void> => {
    try {
      const result = await cancelLeaveRequest({
        leaveRequestId: item.id,
      }).unwrap();
      toast.success(result.message || t("cancelSuccess"));
      setCancelOpen(false);
      try {
        await dispatch(
          leaveRequestsApi.endpoints.getAllLeaveRequests.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();
      } catch {
        // The cancel response already patched the list cache.
      }
      router.refresh();
      router.push("/requests");
    } catch (error) {
      toast.error(getLeaveRequestMutationError(error, t("errors.failed")));
    }
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <MainButton
          variant="ghost-brand"
          size="sm"
          startIcon={<ArrowLeft className="size-4 rtl:rotate-180" />}
          link="/requests"
        >
          {t("back")}
        </MainButton>
        <div className="space-y-2">
          <LeaveTypeBadge
            leaveTypeId={item.leaveType.id}
            name={item.leaveType.name}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              {t("detail")}
            </h1>
            {item.status === "pending" ? (
              <div className="flex flex-wrap items-center gap-2">
                <MainButton
                  variant="edit-soft"
                  size="sm"
                  startIcon={<Pencil className="size-4" />}
                  link={`/requests/${item.id}/edit`}
                >
                  {t("edit")}
                </MainButton>
                <MainButton
                  ref={cancelRequestTriggerRef}
                  variant="delete-soft"
                  size="sm"
                  onClick={() => setCancelOpen(true)}
                  disabled={cancelling}
                >
                  {t("cancelRequest")}
                </MainButton>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <dl className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <dt className="text-xs text-text-muted">{t("dates")}</dt>
            <dd className={cn("mt-1 text-sm font-medium text-ink", DISPLAY_DATE_RANGE_VALUE_CLASS)}>
              {formatLeaveRequestRange(
                item.startAt,
                item.endAt,
                locale,
                item.leaveType.unit,
              )}
            </dd>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-[11px] font-semibold leading-none",
              leaveRequestStatusBadgeClass(item.status),
            )}
          >
            {t(`status.${item.status}`)}
          </span>
        </div>
        <div>
          <dt className="text-xs text-text-muted">{t("reason")}</dt>
          <dd className="mt-1 text-sm text-text-secondary">{item.reason}</dd>
        </div>
        {item.rejectionReason ? (
          <div>
            <dt className="text-xs text-text-muted">{t("rejectionReason")}</dt>
            <dd className="mt-1 text-sm text-text-secondary">
              {item.rejectionReason}
            </dd>
          </div>
        ) : null}
        {item.reviewer ? (
          <div>
            <dt className="text-xs text-text-muted">{t("reviewer")}</dt>
            <dd className="mt-1 text-sm font-medium text-ink">
              {item.reviewer.fullName}
            </dd>
          </div>
        ) : null}
        {reviewedAt ? (
          <div>
            <dt className="text-xs text-text-muted">{t("reviewedAt")}</dt>
            <dd className={cn("mt-1 text-sm font-medium text-ink", DISPLAY_DATETIME_VALUE_CLASS)}>
              {reviewedAt}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-text-muted">{t("createdAt")}</dt>
          <dd className={cn("mt-1 text-sm font-medium text-ink", DISPLAY_DATETIME_VALUE_CLASS)}>
            {submittedAt}
          </dd>
        </div>
      </dl>

      <DeleteConfirmModal
        open={cancelOpen}
        title={t("cancelTitle")}
        description={t("cancelDescription")}
        confirmLabel={t("cancelConfirm")}
        cancelLabel={t("cancelDismiss")}
        onConfirm={() => {
          void handleCancel();
          return false;
        }}
        onCancel={() => setCancelOpen(false)}
        loading={cancelling}
        triggerRef={cancelRequestTriggerRef}
      />
    </div>
  );
}

function formatTimestamp(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime12(date, resolveTimeLocale(locale));
}
