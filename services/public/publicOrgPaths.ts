import { getApiBaseUrl } from "@services/auth/shared";
import { PublicOrgApiError } from "@/types/PublicOrgApiTypes";

export function publicBranchesUrl(): string {
  return `${getApiBaseUrl()}/public/branches`;
}

export function publicBranchDepartmentsUrl(branchId: string): string {
  const normalizedBranchId = branchId.trim();

  if (!normalizedBranchId) {
    throw new PublicOrgApiError("Branch id is required.");
  }

  return `${publicBranchesUrl()}/${encodeURIComponent(normalizedBranchId)}/departments`;
}

export function publicJobPositionsUrl(): string {
  return `${getApiBaseUrl()}/public/job-positions`;
}
