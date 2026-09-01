import type {
  ApiBooleanValue,
  ApiCountValue,
  ApiItemResponse,
  ApiListResponse,
  ApiPaginationMeta,
  LocalizedApiObject,
  LocalizedApiValue,
  LocalizedTextPayload,
} from "@/types/ApiSharedTypes";

export type {
  ApiCountValue,
  LocalizedApiObject,
  LocalizedApiValue,
  LocalizedTextPayload,
};

export type LeaveTypeUnit = "day" | "hour";
export type LeaveTypeAllocationType = "yearly" | "monthly" | "none";
export type LeaveTypeGenderRestriction = "none" | "female" | "male";

export function parseLeaveTypeUnit(value: unknown): LeaveTypeUnit {
  if (typeof value !== "string") {
    return "day";
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === "hour" ||
    normalized === "hr" ||
    normalized === "hours"
  ) {
    return "hour";
  }

  return "day";
}

export interface LeaveTypeApiRecord {
  id: number;
  name: LocalizedApiValue;
  description: LocalizedApiValue | null;
  unit: string;
  allocation_type: string;
  allocation_amount: number | string;
  can_carry_forward: ApiBooleanValue;
  carry_forward_limit: number | string | null;
  is_paid: ApiBooleanValue;
  requires_approval: ApiBooleanValue;
  gender_restriction: string;
  is_active: ApiBooleanValue;
  leave_requests_count?: ApiCountValue;
  created_at: string;
  updated_at: string;
}

export interface LeaveTypeRecord {
  id: string;
  name: string;
  description: string;
  nameLocalized: LocalizedTextPayload;
  descriptionLocalized: LocalizedTextPayload;
  unit: LeaveTypeUnit;
  allocationType: LeaveTypeAllocationType;
  allocationAmount: number;
  canCarryForward: boolean;
  carryForwardLimit: number | null;
  isPaid: boolean;
  requiresApproval: boolean;
  genderRestriction: LeaveTypeGenderRestriction;
  isActive: boolean;
  leaveRequestsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type LeaveTypesPaginationMeta = ApiPaginationMeta;

export interface LeaveTypesListQueryParams {
  search?: string;
  page?: number;
}

export interface LeaveTypesListResult {
  leaveTypes: LeaveTypeRecord[];
  meta: LeaveTypesPaginationMeta;
}

export type LeaveTypesListApiResponse = ApiListResponse<LeaveTypeApiRecord>;

export type LeaveTypeApiResponse = ApiItemResponse<LeaveTypeApiRecord>;

export interface LeaveTypePayload {
  name: LocalizedTextPayload;
  description: LocalizedTextPayload;
  unit: LeaveTypeUnit;
  allocation_type: LeaveTypeAllocationType;
  allocation_amount: number;
  can_carry_forward: boolean;
  carry_forward_limit: number | null;
  is_paid: boolean;
  requires_approval: boolean;
  gender_restriction: LeaveTypeGenderRestriction;
  is_active: boolean;
}

export interface LeaveTypeMutationResult {
  leaveType: LeaveTypeRecord;
  message: string;
}

export interface LeaveTypeDeleteResult {
  message: string;
}

export class LeaveTypesApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeaveTypesApiError";
  }
}
