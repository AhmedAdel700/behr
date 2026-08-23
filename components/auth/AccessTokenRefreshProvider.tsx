"use client";

import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import {
  logoutAction,
  refreshTokenAction,
} from "@/app/actions/auth/authActions";
import { REFRESH_ACCESS_TOKEN_ERROR } from "@/lib/auth/refreshJwtAccessToken";
import { isAccessTokenStale } from "@/lib/auth/tokenExpiry";

const CHECK_INTERVAL_MS = 60_000;

interface AccessTokenRefreshProviderProps {
  children: ReactNode;
}

export function AccessTokenRefreshProvider({
  children,
}: AccessTokenRefreshProviderProps): ReactElement {
  const { data: session, status, update } = useSession();
  const locale = useLocale();
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) {
      return;
    }

    if (session.error === REFRESH_ACCESS_TOKEN_ERROR) {
      void logoutAction(locale);
      return;
    }

    const refreshIfNeeded = async (): Promise<void> => {
      if (refreshingRef.current) {
        return;
      }

      if (!isAccessTokenStale(session.accessTokenIssuedAt, session.expiresIn)) {
        return;
      }

      refreshingRef.current = true;

      try {
        const result = await refreshTokenAction(locale);

        if (result.success) {
          await update({
            accessToken: result.user.accessToken,
            tokenType: result.user.tokenType,
            expiresIn: result.user.expiresIn,
            accessTokenIssuedAt: result.user.accessTokenIssuedAt,
          });
          return;
        }

        if (result.shouldLogout) {
          await logoutAction(locale);
        }
      } finally {
        refreshingRef.current = false;
      }
    };

    void refreshIfNeeded();

    const intervalId = window.setInterval(() => {
      void refreshIfNeeded();
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [locale, session, status, update]);

  return <>{children}</>;
}
