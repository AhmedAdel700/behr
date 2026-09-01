import type { ReactElement } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MainButton } from "@/components/shared/MainButton";
import { leaveTypeDotStyle } from "@/lib/employee/leaveTypeColors";
import { isTimeBasedLeaveUnit } from "@/types/LeaveTypesApiTypes";
import type { LeaveTypeRecord } from "@/types/LeaveTypesApiTypes";

export async function RequestTypePicker({
  leaveTypes,
}: {
  leaveTypes: LeaveTypeRecord[];
}): Promise<ReactElement> {
  const t = await getTranslations("employee.requests");

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
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {t("pickType")}
          </h1>
          <p className="text-sm text-text-secondary">{t("pickTypeSubtitle")}</p>
        </div>
      </section>

      {leaveTypes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
          {t("noLeaveTypes")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {leaveTypes.map((leaveType) => (
            <li key={leaveType.id}>
              <Link
                href={`/requests/new/${leaveType.id}`}
                className="flex h-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong"
              >
                <span
                  className="mt-1 inline-block size-3 shrink-0 rounded-full"
                  style={leaveTypeDotStyle(leaveType.id)}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">
                    {leaveType.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-secondary">
                    {leaveType.description.trim()
                      ? leaveType.description
                      : t(
                          leaveType.unit === "min"
                            ? "unitHintMin"
                            : isTimeBasedLeaveUnit(leaveType.unit)
                              ? "unitHintHour"
                              : "unitHintDay",
                        )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
