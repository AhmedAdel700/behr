"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactElement, ReactNode } from "react";
import { AccessTokenRefreshProvider } from "@/components/auth/AccessTokenRefreshProvider";

interface AuthSessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function AuthSessionProvider({
  children,
  session = null,
}: AuthSessionProviderProps): ReactElement {
  return (
    <SessionProvider session={session}>
      <AccessTokenRefreshProvider>{children}</AccessTokenRefreshProvider>
    </SessionProvider>
  );
}
