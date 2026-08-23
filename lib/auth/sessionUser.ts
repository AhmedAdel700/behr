import type { Session } from "next-auth";
import { getSessionUser, type AuthSessionWithToken } from "@/lib/auth/mapUser";
import { REFRESH_ACCESS_TOKEN_ERROR } from "@/lib/auth/refreshJwtAccessToken";

export function isActiveSession(
  session: Session | null | undefined,
): session is Session {
  if (!session?.accessToken || session.error === REFRESH_ACCESS_TOKEN_ERROR) {
    return false;
  }

  return getSessionUser(session) !== null;
}

export function sessionToAuthSessionUser(session: Session): AuthSessionWithToken {
  const user = getSessionUser(session);

  if (!user) {
    throw new Error("Session user is missing.");
  }

  return {
    ...user,
    accessToken: session.accessToken,
    tokenType: session.tokenType,
    expiresIn: session.expiresIn,
    accessTokenIssuedAt: session.accessTokenIssuedAt ?? Date.now(),
  };
}
