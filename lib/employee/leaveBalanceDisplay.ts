import type { LeaveTypeAllocationType } from "@/types/LeaveTypesApiTypes";
import type { LeaveBalanceRecord } from "@/types/LeaveBalancesApiTypes";

export type LeaveBalanceGroupId = "yearly" | "monthly" | "none";

export interface LeaveBalanceGroup {
  id: LeaveBalanceGroupId;
  balances: LeaveBalanceRecord[];
}

const GROUP_ORDER: LeaveBalanceGroupId[] = ["yearly", "monthly", "none"];

export function groupLeaveBalances(
  balances: readonly LeaveBalanceRecord[],
): LeaveBalanceGroup[] {
  const grouped = new Map<LeaveBalanceGroupId, LeaveBalanceRecord[]>();

  for (const balance of balances) {
    const groupId = balance.allocationType;
    const current = grouped.get(groupId) ?? [];
    current.push(balance);
    grouped.set(groupId, current);
  }

  return GROUP_ORDER.flatMap((id) => {
    const items = grouped.get(id);
    if (!items?.length) {
      return [];
    }

    return [
      {
        id,
        balances: [...items].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      },
    ];
  });
}

export function getLeaveUsagePercent(balance: LeaveBalanceRecord): number {
  const total = balance.total > 0 ? balance.total : balance.used + balance.remaining;
  if (total <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((balance.used / total) * 100));
}

export interface LeaveStatsSummary {
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  typesCount: number;
}

export function summarizeLeaveStats(
  balances: readonly LeaveBalanceRecord[],
): LeaveStatsSummary {
  let daysRemaining = 0;
  let hoursRemaining = 0;
  let minutesRemaining = 0;

  for (const balance of balances) {
    if (balance.unit === "hour") {
      hoursRemaining += balance.remaining;
    } else if (balance.unit === "min") {
      minutesRemaining += balance.remaining;
    } else {
      daysRemaining += balance.remaining;
    }
  }

  return {
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    typesCount: balances.length,
  };
}

export function isLeaveBalanceGroupId(
  value: LeaveTypeAllocationType,
): value is LeaveBalanceGroupId {
  return value === "yearly" || value === "monthly" || value === "none";
}
