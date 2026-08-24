import { getApiBaseUrl } from "@services/auth/shared";
import { LeaveRequestsApiError } from "@/types/LeaveRequestsApiTypes";

export function leaveRequestsCollectionUrl(): string {
  return `${getApiBaseUrl()}/leave-requests`;
}

export function leaveRequestItemUrl(leaveRequestId: string): string {
  const normalizedId = leaveRequestId.trim();

  if (!normalizedId) {
    throw new LeaveRequestsApiError("Leave request id is required.");
  }

  return `${leaveRequestsCollectionUrl()}/${encodeURIComponent(normalizedId)}`;
}

export function leaveRequestApproveUrl(leaveRequestId: string): string {
  return `${leaveRequestItemUrl(leaveRequestId)}/approve`;
}

export function leaveRequestRejectUrl(leaveRequestId: string): string {
  return `${leaveRequestItemUrl(leaveRequestId)}/reject`;
}
