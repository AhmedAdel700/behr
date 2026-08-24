import { getApiBaseUrl } from "@services/auth/shared";
import { RegistrationRequestsApiError } from "@/types/RegistrationRequestsApiTypes";

export function registrationRequestsCollectionUrl(): string {
  return `${getApiBaseUrl()}/registration-requests`;
}

export function registrationRequestItemUrl(requestId: string): string {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId) {
    throw new RegistrationRequestsApiError("Registration request id is required.");
  }

  return `${registrationRequestsCollectionUrl()}/${encodeURIComponent(normalizedRequestId)}`;
}

export function registrationRequestAcceptUrl(requestId: string): string {
  return `${registrationRequestItemUrl(requestId)}/accept`;
}

export function registrationRequestRejectUrl(requestId: string): string {
  return `${registrationRequestItemUrl(requestId)}/reject`;
}
