import { getApiBaseUrl } from "@services/auth/shared";
import { EmployeesApiError } from "@/types/EmployeesApiTypes";

export function userItemUrl(userId: string): string {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new EmployeesApiError("User id is required.");
  }

  return `${getApiBaseUrl()}/users/${encodeURIComponent(normalizedUserId)}`;
}
