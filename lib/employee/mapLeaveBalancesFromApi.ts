import { parseLocalizedField } from "@/lib/admin/branchLocalizedText";
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

function mapLeaveBalanceRecord(
  record: LeaveBalanceApiRecord,
  lang: string,
): LeaveBalanceRecord {
  const unit = parseLeaveTypeUnit(record.leave_type.unit);
  const used = minutesToLeaveUnits(record.used_minutes, unit);
  const remaining = minutesToLeaveUnits(record.remaining_minutes, unit);
  const total = minutesToLeaveUnits(record.allocated_minutes, unit);
  const name = parseLocalizedField(record.leave_type.name, lang);
  const description = parseLocalizedField(record.leave_type.description, lang);

  return {
    id: readId(record.id),
    leaveTypeId: readId(record.leave_type_id) || readId(record.leave_type.id),
    name: name.display,
    description: description.display,
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
  lang: string,
): LeaveBalanceRecord[] {
  return records.map((record) => mapLeaveBalanceRecord(record, lang));
}
