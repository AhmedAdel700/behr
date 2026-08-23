import { authApiPaths, buildAuthApiUrl, buildJsonHeaders } from "@services/auth/shared";
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
  const response = await fetch(buildAuthApiUrl(authApiPaths.login), {
    method: "POST",
    headers: buildJsonHeaders(lang),
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

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
