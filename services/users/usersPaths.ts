import { getApiBaseUrl } from "@services/auth/shared";
import { ProfileApiError } from "@/types/ProfileApiTypes";

export function userItemUrl(userId: string): string {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    throw new ProfileApiError("User id is required.");
  }

  return `${getApiBaseUrl()}/users/${encodeURIComponent(normalizedUserId)}`;
}
