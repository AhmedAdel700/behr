import { mapProfileFromApi } from "@/lib/employee/mapProfileFromApi";
import {
  authApiPaths,
  buildAuthApiUrl,
} from "@services/auth/shared";
import { createApiHttp } from "@services/http/apiHttp";
import {
  ProfileApiError,
  type ProfileApiRecord,
  type ProfileResult,
} from "@/types/ProfileApiTypes";

const api = createApiHttp(ProfileApiError, "profile server");

export async function fetchProfile(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  notAvailableLabel = "—",
): Promise<ProfileResult> {
  const { response, payload } = await api.authorizedFetch({
    url: buildAuthApiUrl(authApiPaths.profile),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load profile.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load profile.");
  }

  const { data } = api.assertSuccessResponse<ProfileApiRecord>(
    payload,
    "Failed to load profile.",
  );

  return mapProfileFromApi(data, lang, notAvailableLabel);
}
