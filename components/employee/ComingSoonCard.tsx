import { CalendarClock } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface ComingSoonCardProps {
  title: string;
  badge: string;
  heading: string;
  description: string;
  layout?: "card" | "page";
}

export function ComingSoonCard({
  title,
  badge,
  heading,
  description,
  layout = "card",
}: ComingSoonCardProps): ReactElement {
  if (layout === "page") {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-xs">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary-50 text-primary-700">
          <CalendarClock className="size-7" aria-hidden />
        </span>
        <span className="mt-4 rounded-md bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-800">
          {badge}
        </span>
        <p className="mt-3 text-sm font-medium text-text-muted">{title}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
          {heading}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-dashed border-border bg-surface p-4 shadow-xs",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
            <CalendarClock className="size-4" aria-hidden />
          </span>
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
        </div>
        <span className="shrink-0 rounded-md bg-warning-50 px-2 py-0.5 text-[11px] font-semibold text-warning-800">
          {badge}
        </span>
      </div>
      <p className="text-sm font-medium text-ink">{heading}</p>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </section>
  );
}
