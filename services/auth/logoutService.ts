import {
  authApiPaths,
  buildAuthApiUrl,
  buildAuthHeaders,
} from "@services/auth/shared";import type { LogoutResponse } from "@/types/AuthTypes";
export interface LogoutResult {
  success: boolean;
  message: string;
}

function isLogoutResponse(value: unknown): value is LogoutResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.success === "boolean" && typeof record.message === "string"
  );
}

export async function logout(
  accessToken: string,
  lang: string,
): Promise<LogoutResult> {
  const response = await fetch(buildAuthApiUrl(authApiPaths.logout), {
    method: "POST",
    headers: buildAuthHeaders(accessToken, lang),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!isLogoutResponse(payload)) {
    return {
      success: false,
      message: "Invalid logout response",
    };
  }

  return {
    success: response.ok && payload.success,
    message: payload.message,
  };
}
