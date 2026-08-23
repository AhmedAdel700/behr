"use client";

import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { AdminSessionSync } from "@/components/auth/AdminSessionSync";
import {
  hydrateAdminSession,
  seedAdminSession,
} from "@/lib/admin/adminSessionStore";
import { markSidebarPreferenceReady } from "@/lib/admin/useAdminSidebarPreference";
import type { AdminUser } from "@/types/AdminApiTypes";

interface AdminProvidersProps {
  children: ReactNode;
  initialAdminUser?: AdminUser | null;
}

export function AdminProviders({
  children,
  initialAdminUser = null,
}: AdminProvidersProps): ReactElement {
  const didSeed = useRef(false);

  if (!didSeed.current) {
    if (initialAdminUser?.id) {
      seedAdminSession(initialAdminUser);
    } else {
      hydrateAdminSession();
    }

    didSeed.current = true;
  }

  useEffect(() => {
    markSidebarPreferenceReady();
  }, []);

  return (
    <>
      <AdminSessionSync />
      {children}
    </>
  );
}
