"use client";

import { MOCK_FINGERPRINT_IMPORT_MONTHS } from "@/lib/admin/demo-fingerprint-imports";
import type {
  FingerprintImportMonthData,
  FingerprintImportMonthKey,
} from "@/types/FingerprintImportApiTypes";

const STORAGE_KEY = "behr-fingerprint-imports-v3";

const listeners = new Set<() => void>();

let monthDataMap = new Map<FingerprintImportMonthKey, FingerprintImportMonthData>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function toMonthKey(
  branchId: string,
  year: number,
  month: number,
): FingerprintImportMonthKey {
  return `${branchId}-${year}-${month}`;
}

function emptyMonthData(
  branchId: string,
  year: number,
  month: number,
): FingerprintImportMonthData {
  return { branchId, year, month, uploads: [], records: [] };
}

function readStoredMonths(): FingerprintImportMonthData[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFingerprintImportMonthData);
  } catch {
    return [];
  }
}

function isFingerprintImportMonthData(
  value: unknown,
): value is FingerprintImportMonthData {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("branchId" in value) ||
    !("year" in value) ||
    !("month" in value) ||
    !("uploads" in value) ||
    !("records" in value)
  ) {
    return false;
  }

  return (
    typeof value.branchId === "string" &&
    value.branchId.trim().length > 0 &&
    typeof value.year === "number" &&
    typeof value.month === "number" &&
    Array.isArray(value.uploads) &&
    Array.isArray(value.records)
  );
}

function writeStoredMonths(months: readonly FingerprintImportMonthData[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(months));
}

function rebuildMapFromArray(months: readonly FingerprintImportMonthData[]): void {
  monthDataMap = new Map(
    months.map((item) => [
      toMonthKey(item.branchId, item.year, item.month),
      item,
    ]),
  );
}

function persistMap(): void {
  writeStoredMonths(Array.from(monthDataMap.values()));
}

export function subscribeFingerprintImports(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hydrateFingerprintImports(): void {
  const stored = readStoredMonths();
  const seed = stored.length > 0 ? stored : MOCK_FINGERPRINT_IMPORT_MONTHS;
  rebuildMapFromArray(seed);
  if (stored.length === 0) {
    persistMap();
  }
}

export function getFingerprintImportMonthSnapshot(
  branchId: string,
  year: number,
  month: number,
): FingerprintImportMonthData {
  if (!branchId.trim()) {
    return emptyMonthData(branchId, year, month);
  }

  return (
    monthDataMap.get(toMonthKey(branchId, year, month)) ??
    emptyMonthData(branchId, year, month)
  );
}

export function getAllFingerprintImportMonthsSnapshot(
  branchId?: string,
): FingerprintImportMonthData[] {
  const normalizedBranchId = branchId?.trim();

  return Array.from(monthDataMap.values())
    .filter((item) =>
      normalizedBranchId ? item.branchId === normalizedBranchId : true,
    )
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
}

export function upsertFingerprintImportMonth(data: FingerprintImportMonthData): void {
  monthDataMap.set(toMonthKey(data.branchId, data.year, data.month), data);
  persistMap();
  emit();
}

export function getFingerprintImportsVersionSnapshot(): number {
  return monthDataMap.size;
}
