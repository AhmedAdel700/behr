import { getApiBaseUrl } from "@services/auth/shared";

export function overviewUrl(): string {
  return `${getApiBaseUrl()}/overview`;
}
