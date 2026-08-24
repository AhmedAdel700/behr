import { buildJsonHeaders } from "@services/auth/shared";
import {
  positionItemUrl,
  positionsCollectionUrl,
} from "@services/positions/positionsPaths";
import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
import type {
  PositionApiRecord,
  PositionDeleteResult,
  PositionMutationResult,
  PositionPayload,
  PositionRecord,
  PositionsListQueryParams,
  PositionsListResult,
} from "@/types/PositionsApiTypes";
import { PositionsApiError } from "@/types/PositionsApiTypes";

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

function normalizeText(value: string | null | undefined): string {
  return value ?? "";
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
    throw new PositionsApiError(fallbackMessage);
  }

  const response = payload as {
    success: boolean;
    message: string;
    data: T | null;
  };

  if (!response.success || response.data === null) {
    throw new PositionsApiError(response.message || fallbackMessage);
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
  if (error instanceof PositionsApiError) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new PositionsApiError(
      "Could not reach the positions server. Check CORS/SSL or network.",
    );
  }

  if (error instanceof Error && error.message.includes("fetch failed")) {
    throw new PositionsApiError(
      "Could not reach the positions server. Check SSL certificate or network.",
    );
  }

  throw new PositionsApiError(fallback);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function mapPositionFromApi(record: PositionApiRecord): PositionRecord {
  return {
    id: String(record.id),
    name: normalizeText(record.name),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function buildPositionsListUrl(params?: PositionsListQueryParams): string {
  const searchParams = new URLSearchParams();
  const search = params?.search?.trim();

  if (search) {
    searchParams.set("search", search);
  }

  if (params?.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query
    ? `${positionsCollectionUrl()}?${query}`
    : positionsCollectionUrl();
}

export async function fetchPositions(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: PositionsListQueryParams,
): Promise<PositionsListResult> {
  let response: Response;

  try {
    response = await fetch(buildPositionsListUrl(params), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load positions.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new PositionsApiError(
      parseApiMessage(payload, "Failed to load positions."),
    );
  }

  const { data } = assertSuccessResponse<PositionApiRecord[]>(
    payload,
    "Failed to load positions.",
  );

  if (!Array.isArray(data)) {
    throw new PositionsApiError("Unexpected positions response.");
  }

  return {
    positions: data.map(mapPositionFromApi),
    meta: parsePaginationMeta(payload),
  };
}

const MAX_POSITION_PAGES = 50;

export async function fetchAllPositions(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<PositionRecord[]> {
  const collected: PositionRecord[] = [];
  const seen = new Set<string>();
  let page = 1;
  let lastPage = 1;

  do {
    const result = await fetchPositions(accessToken, lang, tokenType, { page });
    lastPage = Math.max(1, result.meta.last_page);

    for (const position of result.positions) {
      if (seen.has(position.id)) {
        continue;
      }

      seen.add(position.id);
      collected.push(position);
    }

    page += 1;
  } while (page <= lastPage && page <= MAX_POSITION_PAGES);

  return collected;
}

export async function createPositionRequest(
  accessToken: string,
  lang: string,
  body: PositionPayload,
  tokenType = "Bearer",
): Promise<PositionMutationResult> {
  let response: Response;

  try {
    response = await fetch(positionsCollectionUrl(), {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to create position.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new PositionsApiError(
      parseApiMessage(payload, "Failed to create position."),
    );
  }

  const { message, data } = assertSuccessResponse<PositionApiRecord>(
    payload,
    "Failed to create position.",
  );

  return {
    message,
    position: mapPositionFromApi(data),
  };
}

export async function updatePositionRequest(
  accessToken: string,
  lang: string,
  positionId: string,
  body: PositionPayload,
  tokenType = "Bearer",
): Promise<PositionMutationResult> {
  let response: Response;

  try {
    response = await fetch(positionItemUrl(positionId), {
      method: "PUT",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to update position.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new PositionsApiError(
      parseApiMessage(payload, "Failed to update position."),
    );
  }

  const { message, data } = assertSuccessResponse<PositionApiRecord>(
    payload,
    "Failed to update position.",
  );

  return {
    message,
    position: mapPositionFromApi(data),
  };
}

export async function deletePositionRequest(
  accessToken: string,
  lang: string,
  positionId: string,
  tokenType = "Bearer",
): Promise<PositionDeleteResult> {
  let response: Response;

  try {
    response = await fetch(positionItemUrl(positionId), {
      method: "DELETE",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to delete position.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new PositionsApiError(
      parseApiMessage(payload, "Failed to delete position."),
    );
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === false
  ) {
    throw new PositionsApiError(
      parseApiMessage(payload, "Failed to delete position."),
    );
  }

  return {
    message: parseApiMessage(payload, "Position deleted successfully."),
  };
}
