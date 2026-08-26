import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";

export function preserveLeaveTypeOnMerge(
  previous: LeaveRequestRecord | undefined,
  incoming: LeaveRequestRecord,
): LeaveRequestRecord {
  if (incoming.leaveType.name.trim().length > 0) {
    return incoming;
  }

  if (!previous || previous.leaveType.name.trim().length === 0) {
    return incoming;
  }

  return {
    ...incoming,
    leaveTypeId: incoming.leaveTypeId || previous.leaveTypeId,
    leaveType: previous.leaveType,
  };
}

export function upsertLeaveRequestInList(
  list: LeaveRequestRecord[],
  incoming: LeaveRequestRecord,
): void {
  const index = list.findIndex((item) => item.id === incoming.id);
  const merged = preserveLeaveTypeOnMerge(
    index >= 0 ? list[index] : undefined,
    incoming,
  );

  if (index < 0) {
    list.unshift(merged);
    return;
  }

  list[index] = merged;
}
