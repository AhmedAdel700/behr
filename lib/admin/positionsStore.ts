import { MOCK_POSITIONS } from "@/lib/admin/demo-positions";
import { emptyLocalizedText } from "@/lib/admin/branchLocalizedText";
import type { PositionRecord } from "@/types/PositionsApiTypes";

export interface CreatePositionInput {
  name: string;
}

export interface UpdatePositionInput {
  name: string;
}

export type DeletePositionResult =
  | { success: true }
  | { success: false; reason: "not_found" };

let positions: PositionRecord[] = MOCK_POSITIONS.map((item) => ({ ...item }));
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribePositions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPositionsSnapshot(): PositionRecord[] {
  return positions;
}

export function getPositionById(id: string): PositionRecord | undefined {
  return positions.find((item) => item.id === id);
}

export function slugifyPositionName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUniquePositionSlug(
  name: string,
  existing: readonly PositionRecord[],
  excludeId?: string,
): string {
  const base = slugifyPositionName(name) || "position";
  const existingSlugs = new Set(
    existing
      .filter((item) => item.id !== excludeId)
      .map((item) => item.slug),
  );

  if (!existingSlugs.has(base)) return base;

  let suffix = 2;
  while (existingSlugs.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

function isDuplicateName(
  name: string,
  existing: readonly PositionRecord[],
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase();
  return existing.some(
    (item) =>
      item.id !== excludeId && item.name.toLowerCase() === normalized,
  );
}

export function createPosition(
  input: CreatePositionInput,
): PositionRecord | undefined {
  const name = input.name.trim();
  if (!name || isDuplicateName(name, positions)) return undefined;

  const nameLocalized = emptyLocalizedText();
  nameLocalized.en = name;

  const next: PositionRecord = {
    id: `pos-${Date.now()}`,
    slug: buildUniquePositionSlug(name, positions),
    name,
    nameLocalized,
  };

  positions = [...positions, next];
  emit();
  return next;
}

export function updatePosition(
  id: string,
  input: UpdatePositionInput,
): PositionRecord | undefined {
  const index = positions.findIndex((item) => item.id === id);
  if (index < 0) return undefined;

  const current = positions[index];
  if (!current) return undefined;

  const name = input.name.trim();
  if (!name || isDuplicateName(name, positions, id)) return undefined;

  const nameLocalized = {
    ...current.nameLocalized,
    en: name,
  };

  const next: PositionRecord = {
    ...current,
    name,
    nameLocalized,
    slug: buildUniquePositionSlug(name, positions, id),
  };

  positions = [
    ...positions.slice(0, index),
    next,
    ...positions.slice(index + 1),
  ];
  emit();
  return next;
}

export function deletePosition(id: string): DeletePositionResult {
  const exists = positions.some((item) => item.id === id);
  if (!exists) {
    return { success: false, reason: "not_found" };
  }

  positions = positions.filter((item) => item.id !== id);
  emit();
  return { success: true };
}
