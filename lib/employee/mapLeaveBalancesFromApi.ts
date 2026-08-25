import { minutesToLeaveUnits } from "@/lib/employee/leaveBalanceUnits";
import type { LeaveBalanceApiRecord } from "@/types/LeaveBalancesApiTypes";
import type { LeaveBalanceRecord } from "@/types/LeaveBalancesApiTypes";
import {
  parseLeaveTypeUnit,
  type LeaveTypeAllocationType,
} from "@/types/LeaveTypesApiTypes";

function readId(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

function parseAllocationType(value: unknown): LeaveTypeAllocationType {
  if (value === "yearly" || value === "monthly" || value === "none") {
    return value;
  }

  return "none";
}

function mapLeaveBalanceRecord(record: LeaveBalanceApiRecord): LeaveBalanceRecord {
  const unit = parseLeaveTypeUnit(record.leave_type.unit);
  const used = minutesToLeaveUnits(record.used_minutes, unit);
  const remaining = minutesToLeaveUnits(record.remaining_minutes, unit);
  const total = minutesToLeaveUnits(record.allocated_minutes, unit);

  return {
    id: readId(record.id),
    leaveTypeId: readId(record.leave_type_id) || readId(record.leave_type.id),
    name: record.leave_type.name.trim(),
    description: record.leave_type.description?.trim() ?? "",
    unit,
    allocationType: parseAllocationType(record.leave_type.allocation_type),
    used,
    remaining,
    total,
    periodStart: record.period_start,
    periodEnd: record.period_end,
  };
}

export function mapLeaveBalancesFromApi(
  records: readonly LeaveBalanceApiRecord[],
): LeaveBalanceRecord[] {
  return records.map(mapLeaveBalanceRecord);
}
