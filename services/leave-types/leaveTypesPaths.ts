import { getApiBaseUrl } from "@services/auth/shared";
import { LeaveTypesApiError } from "@/types/LeaveTypesApiTypes";

export function leaveTypesCollectionUrl(): string {
  return `${getApiBaseUrl()}/leave-types`;
}

export function leaveTypeItemUrl(leaveTypeId: string): string {
  const normalizedLeaveTypeId = leaveTypeId.trim();

  if (!normalizedLeaveTypeId) {
    throw new LeaveTypesApiError("Leave type id is required.");
  }

  return `${leaveTypesCollectionUrl()}/${encodeURIComponent(normalizedLeaveTypeId)}`;
}
