"use client";

import { useLayoutEffect, type ReactElement } from "react";
import { useSession } from "next-auth/react";
import {
  clearAdminSession,
  setAdminSession,
} from "@/lib/admin/adminSessionStore";
import { getSessionUser, mapSessionUserToAdminUser } from "@/lib/auth/mapUser";

export function AdminSessionSync(): ReactElement | null {
  const { data: session, status } = useSession();

  useLayoutEffect(() => {
    if (status === "loading") {
      return;
    }

    const sessionUser = getSessionUser(session ?? null);

    if (sessionUser?.appRole === "admin") {
      setAdminSession(mapSessionUserToAdminUser(sessionUser));
      return;
    }

    clearAdminSession();
  }, [session, status]);

  return null;
}
