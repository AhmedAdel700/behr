"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MainButton } from "@/components/shared/MainButton";
import { formatStoredTime12, formatRangeLabel, formatTime12, resolveTimeLocale } from "@/lib/formatTime";
import {
  getCurrentPosition,
  LocationError,
} from "@/lib/employee/getCurrentPosition";
import { submitAttendancePunch } from "@/lib/employee/submitAttendancePunch";
import { WORKPLACE } from "@/lib/employee/workplace";
import {
  attendanceStatusSurface,
  demoAttendanceWeek,
  type AttendanceStatus,
} from "@/lib/employee/demo-data";
import type {
  AttendanceAction,
  AttendancePunchErrorCode,
} from "@/types/AttendanceApiTypes";
import { cn } from "@/lib/utils";

type TodayState = "idle" | "in" | "out";

export function AttendancePanel() {
  const t = useTranslations("employee.attendance");
  const locale = useLocale();
  const [state, setState] = useState<TodayState>("idle");
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<AttendanceAction | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    if (state === "out") return t("checkedOut");
    if (state === "in") return t("checkedIn");
    return t("notStarted");
  }, [state, t]);

  const errorMessage = (code: AttendancePunchErrorCode): string => {
    switch (code) {
      case "LOCATION_DENIED":
        return t("locationDenied");
      case "LOCATION_UNAVAILABLE":
        return t("locationUnavailable");
      case "OUTSIDE_GEOFENCE":
        return t("outsideGeofence");
      default: {
        const _exhaustive: never = code;
        return _exhaustive;
      }
    }
  };

  const punch = async (action: AttendanceAction): Promise<void> => {
    setError(null);
    setPendingAction(action);

    try {
      const position = await getCurrentPosition();

      const response = await submitAttendancePunch({
        action,
        workplaceId: WORKPLACE.id,
        location: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          timestamp: position.timestamp,
        },
      });

      if (!response.ok) {
        setError(errorMessage(response.code));
        return;
      }

      const time = formatTime12(new Date(), resolveTimeLocale(locale));
      if (action === "check-in") {
        setCheckIn(time);
        setState("in");
      } else {
        setCheckOut(time);
        setState("out");
      }
    } catch (err) {
      if (err instanceof LocationError) {
        setError(errorMessage(err.code));
        return;
      }
      setError(t("locationUnavailable"));
    } finally {
      setPendingAction(null);
    }
  };

  const isBusy = pendingAction !== null;

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {t("today")}
        </p>
        <p className="mt-2 text-lg font-semibold text-ink">{statusLabel}</p>
        <p className="mt-1 text-xs text-text-muted">{t("locationHint")}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-surface-muted px-3 py-2.5">
            <p className="text-xs text-text-muted">{t("inAt")}</p>
            <p className="mt-0.5 font-medium text-ink">{checkIn ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2.5">
            <p className="text-xs text-text-muted">{t("outAt")}</p>
            <p className="mt-0.5 font-medium text-ink">{checkOut ?? "—"}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <MainButton
            variant="primary"
            block
            disabled={state !== "idle" || isBusy}
            loading={pendingAction === "check-in"}
            onClick={() => {
              void punch("check-in");
            }}
          >
            {t("checkIn")}
          </MainButton>
          <MainButton
            variant="neutral"
            block
            disabled={state !== "in" || isBusy}
            loading={pendingAction === "check-out"}
            onClick={() => {
              void punch("check-out");
            }}
          >
            {t("checkOut")}
          </MainButton>
        </div>

        {error ? (
          <p
            className="mt-3 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2.5 text-sm text-danger-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">{t("thisWeek")}</h2>
        <ul className="space-y-2">
          {demoAttendanceWeek.map((day) => (
            <li
              key={day.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-3 shadow-xs"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{day.date}</p>
                <p className="text-xs text-text-muted">
                  {day.checkIn || day.checkOut
                    ? formatRangeLabel(
                        formatStoredTime12(day.checkIn, resolveTimeLocale(locale)),
                        formatStoredTime12(day.checkOut, resolveTimeLocale(locale)),
                        locale,
                      )
                    : "—"}
                </p>
              </div>
              <StatusChip status={day.status} label={t(`status.${day.status}`)} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusChip({
  status,
  label,
}: {
  status: AttendanceStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
        attendanceStatusSurface[status]
      )}
    >
      {label}
    </span>
  );
}
