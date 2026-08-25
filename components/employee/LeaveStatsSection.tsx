"use client";

import { useMemo, useRef, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import {
  leaveBalancesApi,
  useGetLeaveBalancesQuery,
} from "@/app/store/api/leave-balances/leaveBalancesApi";
import type { AppDispatch } from "@/app/store/store";
import { LeaveBalanceGroupsList } from "@/components/employee/LeaveBalanceGroupsList";
import type { LeaveBalanceRecord } from "@/types/LeaveBalancesApiTypes";

interface LeaveStatsSectionProps {
  employeeId: string;
  initialData?: LeaveBalanceRecord[];
}

export function LeaveStatsSection({
  employeeId,
  initialData,
}: LeaveStatsSectionProps): ReactElement {
  const tLeave = useTranslations("employee.leave");
  const t = useTranslations("admin.employeeDetailPage.leaveStats");
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);
  const queryArgs = useMemo(() => ({ userId: employeeId }), [employeeId]);

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      leaveBalancesApi.util.upsertQueryData(
        "getLeaveBalances",
        queryArgs,
        initialData,
      ),
    );
  }

  const {
    data: leaveBalances,
    isLoading,
    isError,
  } = useGetLeaveBalancesQuery(queryArgs);

  const balances = leaveBalances ?? initialData ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <header className="flex items-center gap-2.5 border-b border-border bg-surface-muted/50 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
          <CalendarDays className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{t("title")}</h2>
          <p className="text-xs text-text-secondary">{tLeave("subtitle")}</p>
        </div>
      </header>

      <div className="p-4">
        {isLoading && balances.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center text-sm text-text-muted">
            {tLeave("loading")}
          </p>
        ) : isError && balances.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center text-sm text-text-muted">
            {tLeave("loadError")}
          </p>
        ) : (
          <LeaveBalanceGroupsList balances={balances} />
        )}
      </div>
    </section>
  );
}
