import { mapBranchFromApi, mapBranchesFromApi } from "@services/branches/mapBranch";
import {
  branchItemUrl,
  branchesCollectionUrl,
} from "@services/branches/branchesPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";
import type {
  BranchApiRecord,
  BranchApiResponse,
  BranchDeleteResult,
  BranchMutationResult,
  BranchPayload,
  BranchesListQueryParams,
  BranchesListResult,
} from "@/types/BranchesApiTypes";
import { BranchesApiError } from "@/types/BranchesApiTypes";

const api = createApiHttp(BranchesApiError, "branches server");

export async function fetchBranches(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: BranchesListQueryParams,
): Promise<BranchesListResult> {
  const { response, payload } = await api.authorizedFetch({
    url: appendListQueryParams(branchesCollectionUrl(), params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load branches.",
  });

  if (!response.ok) {
    throw new BranchesApiError(
      api.parseApiMessage(payload, "Failed to load branches."),
    );
  }

  const { data } = api.assertSuccessResponse<BranchApiRecord[]>(
    payload,
    "Failed to load branches.",
  );

  if (!Array.isArray(data)) {
    throw new BranchesApiError("Unexpected branches response.");
  }

  return {
    branches: mapBranchesFromApi(data),
    meta: api.parsePaginationMeta(payload),
  };
}

const MAX_BRANCH_PAGES = 50;

export async function fetchAllBranches(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<AdminBranchRecord[]> {
  const collected: AdminBranchRecord[] = [];
  const seen = new Set<string>();
  let page = 1;
  let lastPage = 1;

  do {
    const result = await fetchBranches(accessToken, lang, tokenType, { page });
    lastPage = Math.max(1, result.meta.last_page);

    for (const branch of result.branches) {
      if (seen.has(branch.id)) {
        continue;
      }

      seen.add(branch.id);
      collected.push(branch);
    }

    page += 1;
  } while (page <= lastPage && page <= MAX_BRANCH_PAGES);

  return collected;
}

export async function fetchBranchById(
  accessToken: string,
  lang: string,
  branchId: string,
  tokenType = "Bearer",
): Promise<AdminBranchRecord> {
  const { response, payload } = await api.authorizedFetch({
    url: branchItemUrl(branchId),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load branch.",
  });

  if (!response.ok) {
    throw new BranchesApiError(
      api.parseApiMessage(payload, "Failed to load branch."),
    );
  }

  const { data } = api.assertSuccessResponse<BranchApiRecord>(
    payload,
    "Failed to load branch.",
  );

  return mapBranchFromApi(data);
}

export async function createBranchRequest(
  accessToken: string,
  lang: string,
  body: BranchPayload,
  tokenType = "Bearer",
): Promise<BranchMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: branchesCollectionUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage: "Failed to create branch.",
  });

  if (!response.ok) {
    throw new BranchesApiError(
      api.parseApiMessage(payload, "Failed to create branch."),
    );
  }

  const { message, data } = api.assertSuccessResponse<BranchApiResponse["data"]>(
    payload,
    "Failed to create branch.",
  );

  if (!data) {
    throw new BranchesApiError("Failed to create branch.");
  }

  return {
    message,
    branch: mapBranchFromApi(data),
  };
}

export async function updateBranchRequest(
  accessToken: string,
  lang: string,
  branchId: string,
  body: BranchPayload,
  tokenType = "Bearer",
): Promise<BranchMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: branchItemUrl(branchId),
    accessToken,
    lang,
    tokenType,
    method: "PUT",
    body,
    fallbackMessage: "Failed to update branch.",
  });

  if (!response.ok) {
    throw new BranchesApiError(
      api.parseApiMessage(payload, "Failed to update branch."),
    );
  }

  const { message, data } = api.assertSuccessResponse<BranchApiResponse["data"]>(
    payload,
    "Failed to update branch.",
  );

  if (!data) {
    throw new BranchesApiError("Failed to update branch.");
  }

  return {
    message,
    branch: mapBranchFromApi(data),
  };
}

export async function deleteBranchRequest(
  accessToken: string,
  lang: string,
  branchId: string,
  tokenType = "Bearer",
): Promise<BranchDeleteResult> {
  const { response, payload } = await api.authorizedFetch({
    url: branchItemUrl(branchId),
    accessToken,
    lang,
    tokenType,
    method: "DELETE",
    fallbackMessage: "Failed to delete branch.",
  });

  if (!response.ok) {
    throw new BranchesApiError(
      api.parseApiMessage(payload, "Failed to delete branch."),
    );
  }

  api.assertDeleteSuccess(payload, "Failed to delete branch.");

  return {
    message: api.parseDeleteMessage(
      payload,
      "Failed to delete branch.",
      "Branch deleted successfully.",
    ),
  };
}
