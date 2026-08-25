"use client";

import { useMemo, useRef, useState, useEffect, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  leaveRequestsApi,
  useGetAllLeaveRequestsQuery,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { LeaveTypeBadge } from "@/components/employee/LeaveTypeBadge";
import { MainButton } from "@/components/shared/MainButton";
import {
  formatRequestMonthLabel,
  groupRequestsByMonth,
} from "@/lib/employee/groupRequestsByMonth";
import { formatLeaveRequestRange } from "@/lib/employee/leaveRequestDisplay";
import { cn } from "@/lib/utils";
import { DISPLAY_DATE_RANGE_VALUE_CLASS } from "@/lib/tableCells";
import type {
  LeaveRequestRecord,
  LeaveRequestStatus,
} from "@/types/LeaveRequestsApiTypes";

export function RequestsList({
  initialData,
}: {
  initialData?: LeaveRequestRecord[];
}): ReactElement {
  const t = useTranslations("employee.requests");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      leaveRequestsApi.util.upsertQueryData(
        "getAllLeaveRequests",
        undefined,
        initialData,
      ),
    );
  }

  const {
    data: leaveRequests,
    isLoading,
    isError,
  } = useGetAllLeaveRequestsQuery();

  const requests = leaveRequests ?? initialData ?? [];
  const monthGroups = useMemo(
    () => groupRequestsByMonth(requests),
    [requests],
  );

  const [openMonths, setOpenMonths] = useState<ReadonlySet<string>>(() => {
    const newest = groupRequestsByMonth(initialData ?? [])[0]?.key;
    return newest ? new Set([newest]) : new Set();
  });
  const didAutoOpen = useRef((initialData ?? []).length > 0);

  useEffect(() => {
    if (didAutoOpen.current) {
      return;
    }

    const newest = monthGroups[0]?.key;
    if (!newest) {
      return;
    }

    didAutoOpen.current = true;
    setOpenMonths((prev) => (prev.size > 0 ? prev : new Set([newest])));
  }, [monthGroups]);

  const toggleMonth = (key: string): void => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="text-sm text-text-secondary">{t("subtitle")}</p>
        </div>
        <MainButton
          variant="primary"
          size="sm"
          link="/requests/new"
          startIcon={<Plus className="size-4" />}
        >
          {t("new")}
        </MainButton>
      </section>

      {isLoading && requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          {t("loading")}
        </p>
      ) : isError && requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          {t("loadError")}
        </p>
      ) : monthGroups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-5">
          {monthGroups.map((group) => {
            const isOpen = openMonths.has(group.key);
            const panelId = `requests-month-${group.key}`;

            return (
              <section key={group.key} className="space-y-3">
                <MainButton
                  type="button"
                  variant="ghost"
                  block
                  onClick={() => toggleMonth(group.key)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  endIcon={
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-text-muted transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  }
                  className={cn(
                    "h-auto w-full justify-between gap-3 rounded-xl px-3 py-2.5 text-start font-normal shadow-none ring-0",
                    isOpen
                      ? "bg-transparent hover:bg-transparent"
                      : "bg-surface-muted hover:bg-neutral-200/70",
                  )}
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {formatRequestMonthLabel(group.key, locale)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {t("monthCount", { count: group.items.length })}
                    </span>
                  </span>
                </MainButton>

                {isOpen ? (
                  <ul id={panelId} className="space-y-3">
                    {group.items.map((item) => (
                      <RequestCard key={item.id} item={item} locale={locale} />
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  item,
  locale,
}: {
  item: LeaveRequestRecord;
  locale: string;
}): ReactElement {
  const t = useTranslations("employee.requests");

  return (
    <li>
      <Link
        href={`/requests/${item.id}`}
        className="block rounded-2xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <LeaveTypeBadge
              leaveTypeId={item.leaveType.id}
              name={item.leaveType.name}
            />
            <p className={cn("text-sm font-medium text-ink", DISPLAY_DATE_RANGE_VALUE_CLASS)}>
              {formatLeaveRequestRange(
                item.startAt,
                item.endAt,
                locale,
                item.leaveType.unit,
              )}
            </p>
            <p className="line-clamp-2 text-xs text-text-secondary">
              {item.reason}
            </p>
          </div>
          <StatusBadge
            status={item.status}
            label={t(`status.${item.status}`)}
          />
        </div>
      </Link>
    </li>
  );
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
        "inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-[11px] font-semibold leading-none",
        status === "pending" && "bg-warning-50 text-warning-700",
        status === "approved" && "bg-success-50 text-success-700",
        status === "rejected" && "bg-danger-50 text-danger-700",
      )}
    >
      {label}
    </span>
  );
}
