import type {
  LeaveTypeAllocationType,
  LeaveTypeApiRecord,
  LeaveTypeUnit,
} from "@/types/LeaveTypesApiTypes";

export interface LeaveBalanceApiRecord {
  id: number;
  employee_id: string;
  leave_type_id: string;
  leave_type: LeaveTypeApiRecord;
  period_start: string;
  period_end: string;
  allocated_minutes: number;
  used_minutes: number;
  remaining_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalanceRecord {
  id: string;
  leaveTypeId: string;
  name: string;
  description: string;
  unit: LeaveTypeUnit;
  allocationType: LeaveTypeAllocationType;
  used: number;
  remaining: number;
  total: number;
  periodStart: string;
  periodEnd: string;
}

export interface LeaveBalancesQueryParams {
  userId?: string;
}

export class LeaveBalancesApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeaveBalancesApiError";
  }
}
