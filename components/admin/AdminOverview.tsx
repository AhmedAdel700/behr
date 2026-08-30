"use client";

import {
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import {
  Building2,
  MapPinned,
  UserPlus,
  Users,
} from "lucide-react";
import {
  overviewApi,
  useGetOverviewQuery,
} from "@/app/store/api/overview/overviewApi";
import type { AppDispatch } from "@/app/store/store";
import { MainButton } from "@/components/shared/MainButton";
import { Link } from "@/i18n/navigation";
import { formatLeaveRequestRange } from "@/lib/employee/leaveRequestDisplay";
import { resolveTimeLocale } from "@/lib/formatTime";
import {
  getAdminSessionSnapshot,
  subscribeAdminSession,
} from "@/lib/admin/adminSessionStore";
import { hasPermission } from "@/lib/auth/permissions";
import type { OverviewResult } from "@/types/OverviewApiTypes";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewStatItem {
  key: string;
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  href: string;
}

function getOverviewStatGridClass(count: number): string {
  const columns = Math.min(Math.max(count, 1), 4);

  if (columns === 1) return "grid-cols-1";
  if (columns === 2) return "grid-cols-1 sm:grid-cols-2";
  if (columns === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  href: string;
}): ReactElement {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative block overflow-hidden rounded-2xl border border-border bg-primary-50/15 p-4 shadow-xs transition-colors",
        "hover:border-primary-200 hover:bg-primary-50/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-primary-500/6 to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ink">
            {value}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {hint}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-50/80 text-primary-500 shadow-xs">
          <Icon className="size-5 text-primary-500" strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}

function StatCardSkeleton(): ReactElement {
  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-8 w-16 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-3 w-full max-w-[12rem] animate-pulse rounded-md bg-surface-muted" />
      </div>
    </article>
  );
}

function OverviewAttentionPanel({
  title,
  subtitle,
  count,
  emptyMessage,
  viewAllLabel,
  viewAllHref,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  emptyMessage: string;
  viewAllLabel: string;
  viewAllHref: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
        </div>
        {count > 0 ? (
          <span className="rounded-full bg-warning-50 px-2.5 py-0.5 text-[11px] font-semibold text-warning-700">
            {count}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex-1">
        {count > 0 ? (
          <ul className="space-y-2">{children}</ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
            {emptyMessage}
          </p>
        )}
      </div>

      <MainButton
        variant="ghost-brand"
        size="sm"
        block
        link={viewAllHref}
        className="mt-3 shrink-0"
      >
        {viewAllLabel}
      </MainButton>
    </section>
  );
}

function formatOverviewLeaveRange(
  startAt: string,
  endAt: string,
  locale: string,
): string {
  return formatLeaveRequestRange(
    startAt,
    endAt,
    resolveTimeLocale(locale),
    "day",
  );
}

function buildStatCards(
  overview: OverviewResult,
  permissions: readonly string[],
  translate: {
    (key: "employees"): string;
    (key: "employeesHint"): string;
    (key: "pendingRegistrations"): string;
    (key: "pendingRegistrationsHint"): string;
    (key: "departments"): string;
    (key: "departmentsHint"): string;
    (key: "branches"): string;
    (key: "branchesHint"): string;
  },
): OverviewStatItem[] {
  const { counts } = overview;
  const statCards: OverviewStatItem[] = [
    {
      key: "employees",
      label: translate("employees"),
      value: counts.employees,
      hint: translate("employeesHint"),
      icon: Users,
      href: "/admin-dashboard/employees",
    },
    {
      key: "pendingRegistrations",
      label: translate("pendingRegistrations"),
      value: counts.pendingRegistrationRequests,
      hint: translate("pendingRegistrationsHint"),
      icon: UserPlus,
      href: "/admin-dashboard/registrations",
    },
  ];

  if (counts.departments > 0) {
    statCards.push({
      key: "departments",
      label: translate("departments"),
      value: counts.departments,
      hint: translate("departmentsHint"),
      icon: Building2,
      href: "/admin-dashboard/departments",
    });
  }

  if (
    counts.branches > 0 &&
    hasPermission(permissions, "branches.view")
  ) {
    statCards.push({
      key: "branches",
      label: translate("branches"),
      value: counts.branches,
      hint: translate("branchesHint"),
      icon: MapPinned,
      href: "/admin-dashboard/branches",
    });
  }

  return statCards;
}

export function AdminOverview({
  initialData,
}: {
  initialData?: OverviewResult;
}): ReactElement {
  const t = useTranslations("admin.overview");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionSnapshot,
    getAdminSessionSnapshot,
  );
  const admin = getAdminSessionSnapshot();

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      overviewApi.util.upsertQueryData("getOverview", undefined, initialData),
    );
  }

  const {
    data: overviewResult,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetOverviewQuery();

  const overview = overviewResult ?? initialData;
  const hasSeededInitialData = initialData !== undefined;
  const isOverviewLoading =
    (isLoading || isFetching) && !(hasSeededInitialData && overview);

  const statCards = useMemo(
    () =>
      overview ? buildStatCards(overview, admin.permissions, t) : [],
    [overview, admin.permissions, t],
  );

  if (isOverviewLoading && !overview) {
    return (
      <div className="space-y-[18px]">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="text-sm text-text-secondary">{t("subtitle")}</p>
        </section>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <StatCardSkeleton key={`overview-stat-skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  if (isError && !overview) {
    return (
      <div className="space-y-[18px]">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="text-sm text-text-secondary">{t("subtitle")}</p>
        </section>

        <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-xs">
          <p className="text-sm text-danger-600" role="alert">
            {t("loadError")}
          </p>
          <MainButton
            variant="neutral"
            size="sm"
            className="mt-4"
            onClick={() => {
              void refetch();
            }}
          >
            {t("retry")}
          </MainButton>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="space-y-[18px]">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="text-sm text-text-secondary">{t("subtitle")}</p>
        </section>
      </div>
    );
  }

  const pendingRegistrations = overview.counts.pendingRegistrationRequests;
  const pendingLeave = overview.counts.pendingLeaveRequests;

  return (
    <div className="space-y-[18px]">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
      </section>

      <div
        className={cn(
          "grid gap-[18px]",
          getOverviewStatGridClass(statCards.length),
        )}
      >
        {statCards.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
            href={stat.href}
          />
        ))}
      </div>

      <div className="grid gap-[18px] lg:grid-cols-2">
        <OverviewAttentionPanel
          title={t("attentionTitle")}
          subtitle={t("attentionSubtitle")}
          count={pendingRegistrations}
          emptyMessage={t("attentionEmpty")}
          viewAllLabel={t("viewRegistrations")}
          viewAllHref="/admin-dashboard/registrations"
        >
          {overview.latestRegistrationRequests.map((request) => (
            <li
              key={request.id}
              className="rounded-xl border border-border bg-surface-muted/40 px-3 py-2.5"
            >
              <p className="text-sm font-medium text-ink">{request.fullName}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                {request.jobPosition} · {request.department} · {request.city}
              </p>
            </li>
          ))}
        </OverviewAttentionPanel>

        <OverviewAttentionPanel
          title={t("leaveAttentionTitle")}
          subtitle={t("leaveAttentionSubtitle")}
          count={pendingLeave}
          emptyMessage={t("leaveAttentionEmpty")}
          viewAllLabel={t("viewLeaveRequests")}
          viewAllHref="/admin-dashboard/leave-requests"
        >
          {overview.latestLeaveRequests.map((request) => (
            <li
              key={request.id}
              className="rounded-xl border border-border bg-surface-muted/40 px-3 py-2.5"
            >
              <p className="text-sm font-medium text-ink">
                {request.employeeName}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {request.leaveType} ·{" "}
                {formatOverviewLeaveRange(request.startAt, request.endAt, locale)}{" "}
                · {request.department}
              </p>
            </li>
          ))}
        </OverviewAttentionPanel>
      </div>
    </div>
  );
}
