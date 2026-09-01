import type { ApiBooleanValue, ApiCountValue } from "@/types/ApiSharedTypes";

export function parseApiCount(value: ApiCountValue | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseApiBoolean(value: ApiBooleanValue | null | undefined): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return false;
}

export function parseApiNumber(
  value: number | string | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
