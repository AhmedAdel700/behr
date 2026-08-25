"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { LoginFailedError } from "@/lib/auth/authErrors";
import { AuthNetworkError, isFetchNetworkFailure } from "@services/auth/fetchFailure";
import { getPostLoginPath } from "@/lib/auth/routeAccess";
import { resolveAppRole, resolvePrimaryRole } from "@/lib/auth/roles";
import { logout } from "@services/auth/logoutService";
import { loginWithCredentials } from "@services/auth/loginService";
import { refreshAccessToken } from "@services/auth/refreshTokenService";
import type { AuthSessionWithToken } from "@/lib/auth/mapUser";
import { REFRESH_ACCESS_TOKEN_ERROR } from "@/lib/auth/refreshJwtAccessToken";
import {
  isActiveSession,
  sessionToAuthSessionUser,
} from "@/lib/auth/sessionUser";
import { DEFAULT_LANG } from "@services/auth/shared";
import {
  isAccessTokenExpired,
  isAccessTokenStale,
} from "@/lib/auth/tokenExpiry";

const serverLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  lang: z.string().min(2),
});

export async function loginAction(values: {
  email: string;
  password: string;
  lang: string;
}): Promise<
  | { success: true; redirectTo: string }
  | { success: false; message: string }
> {
  const parsed = serverLoginSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: "invalidCredentials" };
  }

  const email = parsed.data.email.trim();

  let loginData;

  try {
    loginData = await loginWithCredentials(
      email,
      parsed.data.password,
      parsed.data.lang,
    );
  } catch (error) {
    if (error instanceof LoginFailedError) {
      return { success: false, message: error.message };
    }

    if (error instanceof AuthNetworkError) {
      console.error("[loginAction] Auth network error", {
        code: error.code,
        url: error.url,
        message: error.message,
      });
      return {
        success: false,
        message: "Could not reach the authentication server.",
      };
    }

    if (
      error instanceof Error &&
      error.message.includes("NEXT_PUBLIC_BACKEND_BASE_URL is not configured")
    ) {
      console.error("[loginAction] Missing NEXT_PUBLIC_BACKEND_BASE_URL on server");
      return {
        success: false,
        message: "Server configuration error. Contact support.",
      };
    }

    if (isFetchNetworkFailure(error)) {
      console.error("[loginAction] Fetch network failure", error);
      return {
        success: false,
        message: "Could not reach the authentication server.",
      };
    }

    return { success: false, message: "invalidCredentials" };
  }

  try {
    const signInResult = await signIn("credentials", {
      accessToken: loginData.token,
      tokenType: loginData.token_type,
      expiresIn: String(loginData.expires_in),
      userJson: JSON.stringify(loginData.user),
      redirect: false,
    });

    if (
      typeof signInResult === "string" &&
      (signInResult.includes("error=") || signInResult.includes("credentials"))
    ) {
      return {
        success: false,
        message: "Could not create session. Please try again.",
      };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message: "Could not create session. Please try again.",
      };
    }

    throw error;
  }

  const appRole = resolveAppRole(loginData.user.roles);
  const redirectTo = getPostLoginPath({
    appRole,
    primaryRole: resolvePrimaryRole(loginData.user.roles),
    permissions: loginData.user.permissions ?? [],
  });

  return { success: true, redirectTo };
}

export async function refreshTokenAction(
  lang = DEFAULT_LANG,
  options: { force?: boolean } = {},
): Promise<
  | { success: true; user: AuthSessionWithToken }
  | {
      success: false;
      message?: string;
      status?: number;
      shouldLogout?: boolean;
    }
> {
  const session = await auth();
  const sessionError = session?.error;

  if (!isActiveSession(session)) {
    return {
      success: false,
      message:
        sessionError === REFRESH_ACCESS_TOKEN_ERROR
          ? "Session expired"
          : "No active session",
      shouldLogout: true,
    };
  }

  if (
    !options.force &&
    !isAccessTokenStale(session.accessTokenIssuedAt, session.expiresIn)
  ) {
    return { success: true, user: sessionToAuthSessionUser(session) };
  }

  const result = await refreshAccessToken(session.accessToken, lang);

  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.message,
      status: result.status,
      shouldLogout: isAccessTokenExpired(
        session.accessTokenIssuedAt,
        session.expiresIn,
      ),
    };
  }

  const currentUser = sessionToAuthSessionUser(session);

  return {
    success: true,
    user: {
      ...currentUser,
      accessToken: result.data.token,
      tokenType: result.data.token_type,
      expiresIn: result.data.expires_in,
      accessTokenIssuedAt: Date.now(),
    },
  };
}

export async function logoutAction(lang = DEFAULT_LANG): Promise<void> {
  const session = await auth();

  if (session?.accessToken) {
    const result = await logout(session.accessToken, lang);
    if (!result.success) {
      console.error("Backend logout failed:", result.message);
    }
  }

  await signOut({ redirectTo: `/${lang}/login` });
}
