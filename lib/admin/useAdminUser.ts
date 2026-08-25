"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import {
  getAdminSessionSnapshot,
  subscribeAdminSession,
} from "@/lib/admin/adminSessionStore";
import type { AdminUser } from "@/types/AdminApiTypes";

export const AdminInitialUserContext = createContext<AdminUser | null>(null);

export function useAdminUser(): AdminUser {
  const initialAdminUser = useContext(AdminInitialUserContext);

  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionSnapshot,
    getAdminSessionSnapshot,
  );

  const snapshot = getAdminSessionSnapshot();

  if (snapshot.id) {
    return snapshot;
  }

  if (initialAdminUser?.id) {
    return initialAdminUser;
  }

  return snapshot;
}
