import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";

export interface RequestMonthGroup {
  /** `YYYY-MM` */
  key: string;
  items: LeaveRequestRecord[];
}

/** Group requests by created month (`YYYY-MM`), newest month first. */
export function groupRequestsByMonth(
  requests: readonly LeaveRequestRecord[],
): RequestMonthGroup[] {
  const buckets = new Map<string, LeaveRequestRecord[]>();

  const sorted = [...requests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  for (const item of sorted) {
    const key = item.createdAt.slice(0, 7);
    const existing = buckets.get(key);
    if (existing) {
      existing.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({ key, items }));
}

export function formatRequestMonthLabel(
  monthKey: string,
  locale: string,
): string {
  const date = new Date(`${monthKey}-01T12:00:00`);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}
