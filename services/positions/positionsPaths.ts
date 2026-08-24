import { getApiBaseUrl } from "@services/auth/shared";
import { PositionsApiError } from "@/types/PositionsApiTypes";

export function positionsCollectionUrl(): string {
  return `${getApiBaseUrl()}/job-positions`;
}

export function positionItemUrl(positionId: string): string {
  const normalizedPositionId = positionId.trim();

  if (!normalizedPositionId) {
    throw new PositionsApiError("Position id is required.");
  }

  return `${positionsCollectionUrl()}/${encodeURIComponent(normalizedPositionId)}`;
}
