export function formatTime12(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDateTime12(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(date);
}

export function formatTimeValue(hour: string, minute: string): string {
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function parseTimeValue(
  value: string | undefined
): { hour: string; minute: string } | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = match[1];
  const minute = match[2];
  if (!hour || !minute) return null;

  const hourNum = Number(hour);
  const minuteNum = Number(minute);
  if (hourNum < 0 || hourNum > 23 || minuteNum < 0 || minuteNum > 59) {
    return null;
  }

  return { hour, minute };
}

export function formatStoredTime12(
  value: string | null | undefined,
  locale?: string
): string {
  if (!value) return "—";
  const parsed = parseTimeValue(value);
  if (!parsed) return value;

  const date = new Date();
  date.setHours(Number(parsed.hour), Number(parsed.minute), 0, 0);
  return formatTime12(date, locale);
}

export type TimePeriod = "am" | "pm";

export interface ParsedClock12 {
  hour12: number;
  minute: string;
  period: TimePeriod;
  value24: string;
}

export function toValue24(hour12: number, minute: string, period: TimePeriod): string {
  let hour24 = hour12 % 12;
  if (period === "pm") hour24 += 12;
  return formatTimeValue(String(hour24), minute);
}

export function parseClock12(value: string | undefined): ParsedClock12 | null {
  const parsed = parseTimeValue(value);
  if (!parsed) return null;

  const hour24 = Number(parsed.hour);
  const period: TimePeriod = hour24 < 12 ? "am" : "pm";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hour12,
    minute: parsed.minute,
    period,
    value24: formatTimeValue(parsed.hour, parsed.minute),
  };
}

export function formatClock12Display(
  parsed: ParsedClock12,
  amLabel: string,
  pmLabel: string
): string {
  const periodLabel = parsed.period === "am" ? amLabel : pmLabel;
  return `${parsed.hour12}:${parsed.minute} ${periodLabel}`;
}

export function resolveTimeLocale(locale: string): string {
  return locale === "ar" ? "ar-EG" : "en-US";
}

export function formatRangeSeparator(locale: string): string {
  return locale === "ar" ? "←" : "→";
}

export function formatRangeLabel(
  start: string,
  end: string,
  locale: string,
): string {
  if (start === end) {
    return start;
  }

  return `${start} ${formatRangeSeparator(locale)} ${end}`;
}

export function parseStoredDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function formatStoredDate(
  isoDate: string,
  locale?: string
): string {
  const date = parseStoredDate(isoDate);
  if (!date) return isoDate;

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
