import type { LeaveRequestStatus } from "@/types/LeaveRequestsApiTypes";
import { cn } from "@/lib/utils";

export function leaveRequestStatusBadgeClass(
  status: LeaveRequestStatus,
): string {
  return cn(
    status === "pending" && "bg-warning-50 text-warning-700",
    status === "approved" && "bg-success-50 text-success-700",
    status === "rejected" && "bg-danger-50 text-danger-700",
    status === "cancelled" && "bg-neutral-100 text-neutral-600",
  );
}

export function leaveRequestStatusTextClass(
  status: LeaveRequestStatus,
): string {
  return cn(
    status === "pending" && "text-warning-700",
    status === "approved" && "text-success-700",
    status === "rejected" && "text-danger-700",
    status === "cancelled" && "text-neutral-600",
  );
}

export function leaveRequestStatusDotClass(
  status: LeaveRequestStatus,
): string {
  return cn(
    status === "pending" && "bg-warning-500",
    status === "approved" && "bg-success-500",
    status === "rejected" && "bg-danger-500",
    status === "cancelled" && "bg-neutral-500",
  );
}
