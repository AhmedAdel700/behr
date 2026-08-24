import { mapBranchFromApi, mapBranchesFromApi } from "@services/branches/mapBranch";
import {
  branchItemUrl,
  branchesCollectionUrl,
} from "@services/branches/branchesPaths";
import { buildJsonHeaders } from "@services/auth/shared";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";
import type {
  BranchApiRecord,
  BranchApiResponse,
  BranchDeleteResult,
  BranchMutationResult,
  BranchPayload,
  BranchesListQueryParams,
  BranchesListResult,
  BranchesPaginationMeta,
} from "@/types/BranchesApiTypes";
import { BranchesApiError } from "@/types/BranchesApiTypes";

function buildAuthorizedHeaders(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): HeadersInit {
  return {
    ...buildJsonHeaders(lang),
    Authorization: `${tokenType} ${accessToken}`,
  };
}

function parseApiMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

function assertSuccessResponse<T>(
  payload: unknown,
  fallbackMessage: string,
): { message: string; data: T } {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    typeof payload.success !== "boolean"
  ) {
    throw new BranchesApiError(fallbackMessage);
  }

  const response = payload as { success: boolean; message: string; data: T | null };

  if (!response.success || response.data === null) {
    throw new BranchesApiError(response.message || fallbackMessage);
  }

  return {
    message: response.message,
    data: response.data,
  };
}

function parsePaginationMeta(payload: unknown): BranchesPaginationMeta {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "meta" in payload &&
    typeof payload.meta === "object" &&
    payload.meta !== null
  ) {
    const meta = payload.meta as Record<string, unknown>;

    if (
      typeof meta.current_page === "number" &&
      typeof meta.last_page === "number" &&
      typeof meta.per_page === "number" &&
      typeof meta.total === "number"
    ) {
      return {
        current_page: meta.current_page,
        last_page: meta.last_page,
        per_page: meta.per_page,
        total: meta.total,
      };
    }
  }

  return {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  };
}

function wrapNetworkError(error: unknown, fallback: string): never {
  if (error instanceof BranchesApiError) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new BranchesApiError(
      "Could not reach the branches server. Check CORS/SSL or use the server actions path.",
    );
  }

  if (error instanceof Error && error.message.includes("fetch failed")) {
    throw new BranchesApiError(
      "Could not reach the branches server. Check SSL certificate or network.",
    );
  }

  throw new BranchesApiError(fallback);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function buildBranchesListUrl(params?: BranchesListQueryParams): string {
  const searchParams = new URLSearchParams();
  const search = params?.search?.trim();

  if (search) {
    searchParams.set("search", search);
  }

  if (params?.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query ? `${branchesCollectionUrl()}?${query}` : branchesCollectionUrl();
}

export async function fetchBranches(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: BranchesListQueryParams,
): Promise<BranchesListResult> {
  let response: Response;

  try {
    response = await fetch(buildBranchesListUrl(params), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load branches.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new BranchesApiError(
      parseApiMessage(payload, "Failed to load branches."),
    );
  }

  const { data } = assertSuccessResponse<BranchApiRecord[]>(
    payload,
    "Failed to load branches.",
  );

  if (!Array.isArray(data)) {
    throw new BranchesApiError("Unexpected branches response.");
  }

  return {
    branches: mapBranchesFromApi(data),
    meta: parsePaginationMeta(payload),
  };
}

export async function fetchBranchById(
  accessToken: string,
  lang: string,
  branchId: string,
  tokenType = "Bearer",
): Promise<AdminBranchRecord> {
  let response: Response;

  try {
    response = await fetch(branchItemUrl(branchId), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load branch.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new BranchesApiError(
      parseApiMessage(payload, "Failed to load branch."),
    );
  }

  const { data } = assertSuccessResponse<BranchApiRecord>(
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
  let response: Response;

  try {
    response = await fetch(branchesCollectionUrl(), {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to create branch.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new BranchesApiError(
      parseApiMessage(payload, "Failed to create branch."),
    );
  }

  const { message, data } = assertSuccessResponse<BranchApiResponse["data"]>(
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
  let response: Response;

  try {
    response = await fetch(branchItemUrl(branchId), {
      method: "PUT",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to update branch.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new BranchesApiError(
      parseApiMessage(payload, "Failed to update branch."),
    );
  }

  const { message, data } = assertSuccessResponse<BranchApiResponse["data"]>(
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
  let response: Response;

  try {
    response = await fetch(branchItemUrl(branchId), {
      method: "DELETE",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to delete branch.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new BranchesApiError(
      parseApiMessage(payload, "Failed to delete branch."),
    );
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === false
  ) {
    throw new BranchesApiError(parseApiMessage(payload, "Failed to delete branch."));
  }

  return {
    message: parseApiMessage(payload, "Branch deleted successfully."),
  };
}
