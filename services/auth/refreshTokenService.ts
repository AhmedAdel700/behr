import { readJsonPayload } from "@services/http/apiHttp";
import {
  authApiPaths,
  buildAuthApiUrl,
  buildAuthHeaders,
} from "@services/auth/shared";
import type { RefreshTokenData, RefreshTokenResponse } from "@/types/AuthTypes";
export interface RefreshAccessTokenResult {
  success: boolean;
  message?: string;
  status?: number;
  data?: RefreshTokenData;
}

function isRefreshTokenResponse(value: unknown): value is RefreshTokenResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.success === "boolean" &&
    typeof record.message === "string" &&
    "data" in record
  );
}

function isRefreshTokenData(value: unknown): value is RefreshTokenData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.token === "string" &&
    typeof record.token_type === "string" &&
    typeof record.expires_in === "number"
  );
}

export async function refreshAccessToken(
  accessToken: string,
  lang: string,
): Promise<RefreshAccessTokenResult> {
  const response = await fetch(buildAuthApiUrl(authApiPaths.refresh), {
    method: "POST",
    headers: buildAuthHeaders(accessToken, lang),
  });

  const payload: unknown = await readJsonPayload(response);

  if (!isRefreshTokenResponse(payload)) {
    return {
      success: false,
      message: "Invalid refresh response",
      status: response.status,
    };
  }

  if (!response.ok || !payload.success || payload.data === null) {
    return {
      success: false,
      message: payload.message,
      status: response.status,
    };
  }

  if (!isRefreshTokenData(payload.data)) {
    return {
      success: false,
      message: "Invalid refresh token payload",
      status: response.status,
    };
  }

  return {
    success: true,
    message: payload.message,
    status: response.status,
    data: payload.data,
  };
}
