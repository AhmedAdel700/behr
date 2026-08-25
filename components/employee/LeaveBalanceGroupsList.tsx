"use client";

import { useMemo, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import {
  getLeaveUsagePercent,
  groupLeaveBalances,
} from "@/lib/employee/leaveBalanceDisplay";
import { leaveUnitLabelKey } from "@/lib/employee/leaveBalanceUnits";
import {
  leaveTypeBadgeStyle,
  leaveTypeDotStyle,
} from "@/lib/employee/leaveTypeColors";
import type { LeaveBalanceRecord } from "@/types/LeaveBalancesApiTypes";

interface LeaveBalanceGroupsListProps {
  balances: readonly LeaveBalanceRecord[];
}

export function LeaveBalanceGroupsList({
  balances,
}: LeaveBalanceGroupsListProps): ReactElement {
  const t = useTranslations("employee.leave");
  const groups = useMemo(() => groupLeaveBalances(balances), [balances]);

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center text-sm text-text-muted">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.id}>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t(`groups.${group.id}`)}
          </h3>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {group.balances.map((balance) => (
              <LeaveBalanceCard
                key={balance.id}
                balance={balance}
                usedLabel={t("usedLabel")}
                remainingLabel={t("remainingLabel")}
                unitLabel={t(`units.${leaveUnitLabelKey(balance.unit)}`)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface LeaveBalanceCardProps {
  balance: LeaveBalanceRecord;
  usedLabel: string;
  remainingLabel: string;
  unitLabel: string;
}

function LeaveBalanceCard({
  balance,
  usedLabel,
  remainingLabel,
  unitLabel,
}: LeaveBalanceCardProps): ReactElement {
  const usagePercent = getLeaveUsagePercent(balance);
  const dotStyle = leaveTypeDotStyle(balance.leaveTypeId);
  const badgeStyle = leaveTypeBadgeStyle(balance.leaveTypeId);
  const total = balance.total > 0 ? balance.total : balance.used + balance.remaining;

  return (
    <li className="rounded-xl border border-border/80 bg-surface p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-lg border"
            style={{
              backgroundColor: badgeStyle.backgroundColor,
              borderColor: badgeStyle.borderColor,
            }}
            aria-hidden
          >
            <span className="size-2.5 rounded-full" style={dotStyle} />
          </span>
          <p className="truncate text-sm font-medium text-ink">{balance.name}</p>
        </div>
        <p className="shrink-0 text-end text-[11px] tabular-nums text-text-muted">
          {total} {unitLabel}
        </p>
      </div>

      <div className="mt-3">
        <div
          className="relative h-1.5 overflow-hidden rounded-full bg-neutral-100"
          role="progressbar"
          aria-valuenow={usagePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${usedLabel}: ${balance.used} ${unitLabel}`}
        >
          <div
            className="absolute inset-y-0 start-0 rounded-full transition-[width]"
            style={{ ...dotStyle, width: `${usagePercent}%` }}
          />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/70 bg-surface-muted/40 px-2.5 py-2">
          <dt className="text-[11px] font-medium text-text-muted">{usedLabel}</dt>
          <dd className="mt-0.5 tabular-nums">
            <span className="text-base font-semibold text-ink">{balance.used}</span>
            <span className="ms-1 text-xs text-text-muted">{unitLabel}</span>
          </dd>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface-muted/40 px-2.5 py-2">
          <dt className="text-[11px] font-medium text-text-muted">
            {remainingLabel}
          </dt>
          <dd className="mt-0.5 tabular-nums">
            <span
              className="text-base font-semibold"
              style={{ color: badgeStyle.color }}
            >
              {balance.remaining}
            </span>
            <span className="ms-1 text-xs text-text-muted">{unitLabel}</span>
          </dd>
        </div>
      </dl>
    </li>
  );
}
