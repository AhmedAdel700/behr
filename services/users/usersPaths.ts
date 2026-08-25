import { getApiBaseUrl } from "@services/auth/shared";
import { EmployeesApiError } from "@/types/EmployeesApiTypes";

export function usersCollectionUrl(): string {
  return `${getApiBaseUrl()}/users`;
}

export function userItemUrl(userId: string): string {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new EmployeesApiError("User id is required.");
  }

  return `${usersCollectionUrl()}/${encodeURIComponent(normalizedUserId)}`;
}
