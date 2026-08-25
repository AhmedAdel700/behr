"use client";

import { useMemo, useRef, useState, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import { arSA, enUS } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import {
  attendanceApi,
  useGetAttendanceHistoryQuery,
} from "@/app/store/api/attendance/attendanceApi";
import type { AppDispatch } from "@/app/store/store";
import { Calendar } from "@/components/ui/calendar";
import { MainButton } from "@/components/shared/MainButton";
import {
  getMonthAbsentCount,
  getMonthWorkedCount,
  parseISODateLocal,
  type AttendanceHistoryMark,
  type AttendanceHistoryMonth,
} from "@/lib/employee/attendanceHistory";
import { cn } from "@/lib/utils";
import type { AttendanceHistoryResult } from "@/types/AttendanceApiTypes";

const MARK_CELL_CLASS: Record<AttendanceHistoryMark, string> = {
  worked:
    "[&_button]:bg-attendance-present-50 [&_button]:text-attendance-present-700 [&_button]:hover:bg-attendance-present-50 [&_button]:hover:text-attendance-present-700",
  remote:
    "[&_button]:bg-attendance-remote-50 [&_button]:text-attendance-remote-700 [&_button]:hover:bg-attendance-remote-50 [&_button]:hover:text-attendance-remote-700",
  absent:
    "[&_button]:bg-attendance-absent-50 [&_button]:text-attendance-absent-700 [&_button]:hover:bg-attendance-absent-50 [&_button]:hover:text-attendance-absent-700",
  off: "[&_button]:bg-attendance-holiday-50 [&_button]:text-attendance-holiday-700 [&_button]:hover:bg-attendance-holiday-50 [&_button]:hover:text-attendance-holiday-700",
};

function formatMonthLabel(month: AttendanceHistoryMonth, locale: string): string {
  if (month.label?.trim()) {
    return month.label;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(month.year, month.month - 1, 1));
}

function MonthAttendanceCalendar({
  month,
}: {
  month: AttendanceHistoryMonth;
}): ReactElement {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dayPickerLocale = isRtl ? arSA : enUS;
  const monthDate = useMemo(
    () => new Date(month.year, month.month - 1, 1),
    [month.month, month.year]
  );

  const modifiers = useMemo(() => {
    const worked: Date[] = [];
    const remote: Date[] = [];
    const absent: Date[] = [];
    const off: Date[] = [];

    for (const day of month.days) {
      const date = parseISODateLocal(day.date);
      if (!date || !day.mark) continue;
      if (day.mark === "worked") worked.push(date);
      else if (day.mark === "remote") remote.push(date);
      else if (day.mark === "absent") absent.push(date);
      else off.push(date);
    }

    return { worked, remote, absent, off };
  }, [month.days]);

  return (
    <Calendar
      mode="single"
      month={monthDate}
      onMonthChange={() => undefined}
      selected={undefined}
      onSelect={() => undefined}
      disableNavigation
      locale={dayPickerLocale}
      dir={isRtl ? "rtl" : "ltr"}
      modifiers={modifiers}
      modifiersClassNames={{
        worked: MARK_CELL_CLASS.worked,
        remote: MARK_CELL_CLASS.remote,
        absent: MARK_CELL_CLASS.absent,
        off: MARK_CELL_CLASS.off,
      }}
      className="w-full bg-transparent p-0 [--cell-size:2.5rem]"
      classNames={{
        root: "w-full",
        months: "relative flex w-full flex-col",
        month: "flex w-full flex-col gap-1",
        month_caption: "hidden",
        nav: "hidden",
        weekdays: "flex w-full gap-0.5",
        weekday:
          "flex h-(--cell-size) flex-1 items-center justify-center text-[0.7rem] font-medium text-text-muted",
        week: "mt-0.5 flex w-full gap-0.5",
        day: "group/day relative h-(--cell-size) flex-1 p-0 text-center",
        outside: "opacity-30",
        today: "rounded-md",
      }}
    />
  );
}

interface AttendanceHistorySectionProps {
  userId?: string;
  initialData?: AttendanceHistoryResult;
}

export function AttendanceHistorySection({
  userId,
  initialData,
}: AttendanceHistorySectionProps): ReactElement {
  const t = useTranslations("employee.home.attendanceHistory");
  const locale = useLocale();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  const queryArgs = useMemo(
    () => (userId ? { userId } : undefined),
    [userId],
  );

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      attendanceApi.util.upsertQueryData(
        "getAttendanceHistory",
        queryArgs,
        initialData,
      ),
    );
  }

  const {
    data: attendanceHistory,
    isLoading,
    isError,
  } = useGetAttendanceHistoryQuery(queryArgs);

  const months = attendanceHistory?.months ?? initialData?.months ?? [];

  const [openMonths, setOpenMonths] = useState<ReadonlySet<string>>(
    () => new Set(months[0] ? [months[0].key] : [])
  );

  const toggleMonth = (key: string): void => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <section className="space-y-3">
      <div className="space-y-1.5">
        <h2 className="text-base font-bold text-ink">{t("title")}</h2>
        <p className="text-sm font-medium text-text-secondary">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm font-medium text-text-secondary">
        <LegendSwatch
          className="bg-attendance-present-50 text-attendance-present-700"
          label={t("legendWorked")}
        />
        <LegendSwatch
          className="bg-attendance-remote-50 text-attendance-remote-700"
          label={t("legendRemote")}
        />
        <LegendSwatch
          className="bg-attendance-absent-50 text-attendance-absent-700"
          label={t("legendAbsent")}
        />
        <LegendSwatch
          className="bg-attendance-holiday-50 text-attendance-holiday-700"
          label={t("legendOff")}
        />
      </div>

      {isLoading && months.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          {t("loading")}
        </p>
      ) : isError && months.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          {t("loadError")}
        </p>
      ) : months.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {months.map((month) => {
            const isOpen = openMonths.has(month.key);
            const panelId = `attendance-history-${month.key}`;

            return (
              <div
                key={month.key}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <MainButton
                  type="button"
                  variant="ghost"
                  block
                  onClick={() => toggleMonth(month.key)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  endIcon={
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-text-muted transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  }
                  className={cn(
                    "h-auto w-full justify-between gap-3 rounded-none border-0 px-3 py-2.5 text-start font-normal shadow-none ring-0",
                    "bg-surface hover:bg-surface-muted/40"
                  )}
                >
                  <span className="min-w-0 text-start">
                    <span className="block text-sm font-semibold text-ink">
                      {formatMonthLabel(month, locale)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {t("monthSummary", {
                        worked: getMonthWorkedCount(month),
                        absent: getMonthAbsentCount(month),
                      })}
                    </span>
                  </span>
                </MainButton>

                {isOpen ? (
                  <div
                    id={panelId}
                    className="border-t border-border bg-surface px-2 py-2"
                  >
                    <MonthAttendanceCalendar month={month} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LegendSwatch({
  className,
  label,
}: {
  className: string;
  label: string;
}): ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "grid size-6 place-items-center rounded-md text-[11px] font-semibold",
          className
        )}
        aria-hidden
      >
        12
      </span>
      <span>{label}</span>
    </span>
  );
}
