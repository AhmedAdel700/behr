"use client";

import { useRef, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import {
  leaveRequestsApi,
  useGetLeaveRequestQuery,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { LeaveTypeBadge } from "@/components/employee/LeaveTypeBadge";
import { MainButton } from "@/components/shared/MainButton";
import { formatLeaveRequestRange } from "@/lib/employee/leaveRequestDisplay";
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
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

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
  } = useGetLeaveRequestQuery(id, { skip: !id });

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
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {t("detail")}
          </h1>
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
              item.status === "pending" && "bg-warning-50 text-warning-700",
              item.status === "approved" && "bg-success-50 text-success-700",
              item.status === "rejected" && "bg-danger-50 text-danger-700",
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
