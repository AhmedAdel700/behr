import { getApiBaseUrl } from "@services/auth/shared";
import { BranchesApiError } from "@/types/BranchesApiTypes";

export function branchesCollectionUrl(): string {
  return `${getApiBaseUrl()}/branches`;
}

export function branchItemUrl(branchId: string): string {
  const normalizedBranchId = branchId.trim();

  if (!normalizedBranchId) {
    throw new BranchesApiError("Branch id is required.");
  }

  return `${branchesCollectionUrl()}/${encodeURIComponent(normalizedBranchId)}`;
}
