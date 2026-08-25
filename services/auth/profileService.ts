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
  type ProfileUpdatePayload,
  type ProfileUpdateResult,
} from "@/types/ProfileApiTypes";

const api = createApiHttp(ProfileApiError, "profile server");

function toProfileUpdateFormData(payload: ProfileUpdatePayload): FormData {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("email", payload.email);

  if (payload.password) {
    formData.append("password", payload.password);
    formData.append(
      "password_confirmation",
      payload.password_confirmation ?? "",
    );
  }

  if (payload.image) {
    formData.append("image", payload.image);
  }

  return formData;
}

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

export async function updateProfile(
  payload: ProfileUpdatePayload,
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  notAvailableLabel = "—",
): Promise<ProfileUpdateResult> {
  const { response, payload: responsePayload } = await api.authorizedFetch({
    url: buildAuthApiUrl(authApiPaths.profile),
    method: "POST",
    accessToken,
    lang,
    tokenType,
    body: toProfileUpdateFormData(payload),
    fallbackMessage: "Failed to update profile.",
  });

  if (!response.ok) {
    api.throwFromPayload(responsePayload, "Failed to update profile.");
  }

  const { message, data } = api.assertSuccessResponse<ProfileApiRecord>(
    responsePayload,
    "Failed to update profile.",
  );

  return {
    message,
    profile: mapProfileFromApi(data, lang, notAvailableLabel),
  };
}
