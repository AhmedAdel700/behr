import { authApiPaths, buildAuthApiUrl, buildJsonHeaders } from "@services/auth/shared";
import {
  AuthNetworkError,
  getFetchFailureDetails,
} from "@services/auth/fetchFailure";
import { normalizeLoginData } from "@services/auth/normalizeLoginData";
import { LoginFailedError } from "@/lib/auth/authErrors";
import type { LoginData, LoginResponse } from "@/types/AuthTypes";
export {
  isLoginData,
  normalizeLoginData,
  parseLoginPayload,
  parseLoginUserPayload,
} from "@services/auth/normalizeLoginData";

function isLoginResponse(value: unknown): value is LoginResponse {
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

export async function loginWithCredentials(
  email: string,
  password: string,
  lang: string,
): Promise<LoginData> {
  const url = buildAuthApiUrl(authApiPaths.login);
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: buildJsonHeaders(lang),
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });
  } catch (error) {
    const details = getFetchFailureDetails(error, url);
    console.error("[auth/login] Could not reach API", details);
    throw new AuthNetworkError(details);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!isLoginResponse(payload)) {
    throw new LoginFailedError("Invalid credentials");
  }

  if (!payload.success || payload.data === null) {
    throw new LoginFailedError(payload.message);
  }

  const loginData = normalizeLoginData(payload.data);

  if (!loginData) {
    throw new LoginFailedError("Invalid login response");
  }

  return loginData;
}
