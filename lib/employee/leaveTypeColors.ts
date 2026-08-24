export const LEAVE_TYPE_COLOR_COUNT = 100;

export function leaveTypeColorIndex(leaveTypeId: string | number): number {
  const parsed = Number(leaveTypeId);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  const normalized = Math.trunc(parsed);
  return ((normalized - 1) % LEAVE_TYPE_COLOR_COUNT) + 1;
}

export function leaveTypeColorVar(leaveTypeId: string | number): string {
  return `var(--leave-type-${leaveTypeColorIndex(leaveTypeId)})`;
}

export function leaveTypeDotStyle(
  leaveTypeId: string | number,
): { backgroundColor: string } {
  return { backgroundColor: leaveTypeColorVar(leaveTypeId) };
}

export function leaveTypeBadgeStyle(leaveTypeId: string | number): {
  backgroundColor: string;
  borderColor: string;
  color: string;
} {
  const color = leaveTypeColorVar(leaveTypeId);
  return {
    backgroundColor: `color-mix(in srgb, ${color} 16%, var(--color-surface))`,
    borderColor: `color-mix(in srgb, ${color} 28%, transparent)`,
    color,
  };
}
