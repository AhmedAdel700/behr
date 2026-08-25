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

interface LeaveBalanceSectionProps {
  initialData?: LeaveBalanceRecord[];
}

export function LeaveBalanceSection({
  initialData,
}: LeaveBalanceSectionProps): ReactElement {
  const t = useTranslations("employee.leave");
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      leaveBalancesApi.util.upsertQueryData(
        "getLeaveBalances",
        undefined,
        initialData,
      ),
    );
  }

  const {
    data: leaveBalances,
    isLoading,
    isError,
  } = useGetLeaveBalancesQuery();

  const balances = useMemo(
    () => leaveBalances ?? initialData ?? [],
    [initialData, leaveBalances],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <header className="flex items-center gap-2.5 border-b border-border bg-surface-muted/50 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
          <CalendarDays className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{t("title")}</h2>
          <p className="text-xs text-text-secondary">{t("subtitle")}</p>
        </div>
      </header>

      <div className="p-4">
        {isLoading && balances.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center text-sm text-text-muted">
            {t("loading")}
          </p>
        ) : isError && balances.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center text-sm text-text-muted">
            {t("loadError")}
          </p>
        ) : (
          <LeaveBalanceGroupsList balances={balances} />
        )}
      </div>
    </section>
  );
}
