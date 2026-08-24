import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
import type { LeaveTypeUnit } from "@/types/LeaveTypesApiTypes";

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export interface LeaveRequestApiEmployee {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  fingerprint_number: string | null;
  image: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestApiLeaveType {
  id: number;
  name: string;
  description: string | null;
  unit: LeaveTypeUnit;
  allocation_type: string;
  allocation_amount: number;
  can_carry_forward: boolean;
  carry_forward_limit: number | null;
  is_paid: boolean;
  requires_approval: boolean;
  gender_restriction: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestApiReviewer {
  id: number;
  full_name: string;
  email?: string;
  phone?: string | null;
  fingerprint_number?: string | null;
  image?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequestApiApproval {
  id: number | string;
  leave_request_id: number | string;
  approver_id: number | string;
  approver: LeaveRequestApiReviewer | null;
  level: number;
  status: string;
  comment: string | null;
  action_at: string | null;
  created_at: string;
}

export interface LeaveRequestApiRecord {
  id: number | string;
  employee_id: number | string;
  employee: LeaveRequestApiEmployee | null;
  leave_type_id: number | string;
  leave_type: LeaveRequestApiLeaveType | null;
  start_at: string;
  end_at: string;
  duration_minutes: number | string;
  status: string;
  reason: string | null;
  reviewed_by: number | string | null;
  reviewer?: LeaveRequestApiReviewer | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  approvals?: LeaveRequestApiApproval[];
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestEmployeeSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  fingerprintNumber: string;
  image: string | null;
}

export interface LeaveRequestTypeSummary {
  id: string;
  name: string;
  description: string;
  unit: LeaveTypeUnit;
}

export interface LeaveRequestReviewerSummary {
  id: string;
  fullName: string;
}

export interface LeaveRequestApproval {
  id: string;
  leaveRequestId: string;
  approverId: string;
  approver: LeaveRequestReviewerSummary | null;
  level: number;
  status: LeaveRequestStatus;
  comment: string;
  actionAt: string | null;
  createdAt: string;
}

export interface LeaveRequestRecord {
  id: string;
  employeeId: string;
  employee: LeaveRequestEmployeeSummary | null;
  leaveTypeId: string;
  leaveType: LeaveRequestTypeSummary;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: LeaveRequestStatus;
  reason: string;
  reviewer: LeaveRequestReviewerSummary | null;
  reviewedAt: string | null;
  rejectionReason: string;
  approvals: LeaveRequestApproval[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestsListQueryParams {
  page?: number;
  search?: string;
  status?: LeaveRequestStatus;
}

export interface LeaveRequestsListResult {
  leaveRequests: LeaveRequestRecord[];
  meta: BranchesPaginationMeta;
}

export interface LeaveRequestPayload {
  leave_type_id: number;
  start_at: string;
  end_at: string;
  reason: string;
}

export interface RejectLeaveRequestPayload {
  comment: string;
  rejection_reason: string;
}

export interface LeaveRequestMutationResult {
  leaveRequest: LeaveRequestRecord;
  message: string;
}

export class LeaveRequestsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeaveRequestsApiError";
  }
}
