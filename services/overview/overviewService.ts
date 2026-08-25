import { mapOverviewFromApi } from "@/lib/admin/mapOverviewFromApi";
import { overviewUrl } from "@services/overview/overviewPaths";
import { createApiHttp } from "@services/http/apiHttp";
import type { OverviewApiData, OverviewResult } from "@/types/OverviewApiTypes";
import { OverviewApiError } from "@/types/OverviewApiTypes";

const api = createApiHttp(OverviewApiError, "overview server");

export async function fetchOverview(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<OverviewResult> {
  const { response, payload } = await api.authorizedFetch({
    url: overviewUrl(),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load overview.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load overview.");
  }

  const { data } = api.assertSuccessResponse<OverviewApiData>(
    payload,
    "Failed to load overview.",
  );

  if (typeof data !== "object" || data === null || !("counts" in data)) {
    throw new OverviewApiError("Unexpected overview response.");
  }

  return mapOverviewFromApi(data);
}
