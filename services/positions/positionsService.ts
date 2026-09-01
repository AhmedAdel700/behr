import { parseLocalizedField } from "@/lib/admin/branchLocalizedText";
import {
  positionItemUrl,
  positionsCollectionUrl,
} from "@services/positions/positionsPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
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

const api = createApiHttp(PositionsApiError, "positions server");

function mapPositionFromApi(
  record: PositionApiRecord,
  lang: string,
): PositionRecord {
  const name = parseLocalizedField(record.name, lang);

  return {
    id: String(record.id),
    name: name.display,
    nameLocalized: name.localized,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function fetchPositions(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: PositionsListQueryParams,
): Promise<PositionsListResult> {
  const { response, payload } = await api.authorizedFetch({
    url: appendListQueryParams(positionsCollectionUrl(), params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load positions.",
  });

  if (!response.ok) {
    throw new PositionsApiError(
      api.parseApiMessage(payload, "Failed to load positions."),
    );
  }

  const { data } = api.assertSuccessResponse<PositionApiRecord[]>(
    payload,
    "Failed to load positions.",
  );

  if (!Array.isArray(data)) {
    throw new PositionsApiError("Unexpected positions response.");
  }

  return {
    positions: data.map((record) => mapPositionFromApi(record, lang)),
    meta: api.parsePaginationMeta(payload),
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
  const { response, payload } = await api.authorizedFetch({
    url: positionsCollectionUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage: "Failed to create position.",
  });

  if (!response.ok) {
    throw new PositionsApiError(
      api.parseApiMessage(payload, "Failed to create position."),
    );
  }

  const { message, data } = api.assertSuccessResponse<PositionApiRecord>(
    payload,
    "Failed to create position.",
  );

  return {
    message,
    position: mapPositionFromApi(data, lang),
  };
}

export async function updatePositionRequest(
  accessToken: string,
  lang: string,
  positionId: string,
  body: PositionPayload,
  tokenType = "Bearer",
): Promise<PositionMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: positionItemUrl(positionId),
    accessToken,
    lang,
    tokenType,
    method: "PUT",
    body,
    fallbackMessage: "Failed to update position.",
  });

  if (!response.ok) {
    throw new PositionsApiError(
      api.parseApiMessage(payload, "Failed to update position."),
    );
  }

  const { message, data } = api.assertSuccessResponse<PositionApiRecord>(
    payload,
    "Failed to update position.",
  );

  return {
    message,
    position: mapPositionFromApi(data, lang),
  };
}

export async function deletePositionRequest(
  accessToken: string,
  lang: string,
  positionId: string,
  tokenType = "Bearer",
): Promise<PositionDeleteResult> {
  const { response, payload } = await api.authorizedFetch({
    url: positionItemUrl(positionId),
    accessToken,
    lang,
    tokenType,
    method: "DELETE",
    fallbackMessage: "Failed to delete position.",
  });

  if (!response.ok) {
    throw new PositionsApiError(
      api.parseApiMessage(payload, "Failed to delete position."),
    );
  }

  api.assertDeleteSuccess(payload, "Failed to delete position.");

  return {
    message: api.parseDeleteMessage(
      payload,
      "Failed to delete position.",
      "Position deleted successfully.",
    ),
  };
}
