import type { JWT } from "next-auth/jwt";
import { refreshAccessToken } from "@services/auth/refreshTokenService";
import {
  isAccessTokenExpired,
  isAccessTokenStale,
} from "@/lib/auth/tokenExpiry";

export const REFRESH_ACCESS_TOKEN_ERROR = "RefreshAccessTokenError";

export async function refreshJwtAccessToken(token: JWT): Promise<JWT> {
  const accessToken =
    typeof token.accessToken === "string" ? token.accessToken : "";

  if (!accessToken) {
    return { ...token, error: REFRESH_ACCESS_TOKEN_ERROR };
  }

  if (!isAccessTokenStale(token.accessTokenIssuedAt, token.expiresIn)) {
    return token;
  }

  const result = await refreshAccessToken(accessToken, "ar");

  if (!result.success || !result.data) {
    if (
      isAccessTokenExpired(token.accessTokenIssuedAt, token.expiresIn) ||
      result.status === 401
    ) {
      return { ...token, error: REFRESH_ACCESS_TOKEN_ERROR };
    }

    return token;
  }

  return {
    ...token,
    accessToken: result.data.token,
    tokenType: result.data.token_type,
    expiresIn: result.data.expires_in,
    accessTokenIssuedAt: Date.now(),
    error: undefined,
  };
}
