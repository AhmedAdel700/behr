"use client";

import type { AdminUser } from "@/types/AdminApiTypes";

const STORAGE_KEY = "behr-admin-session";

const EMPTY_ADMIN_USER: AdminUser = {
  id: "",
  name: "",
  email: "",
  role: "department_manager",
  permissions: [],
};

let adminUser: AdminUser = EMPTY_ADMIN_USER;
let loggingOut = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "role" in parsed
    ) {
      return parsed as AdminUser;
    }
  } catch {
    return null;
  }
  return null;
}

function writeStoredUser(user: AdminUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function subscribeAdminSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAdminSessionSnapshot(): AdminUser {
  return adminUser;
}

export function isAdminLoggingOut(): boolean {
  return loggingOut;
}

export function beginAdminLogout(): void {
  if (loggingOut) {
    return;
  }

  loggingOut = true;
  emit();
}

export function hydrateAdminSession(): AdminUser {
  const stored = readStoredUser();
  if (stored?.id) {
    adminUser = stored;
  }
  return adminUser;
}

export function seedAdminSession(user: AdminUser): void {
  if (!user.id) {
    return;
  }

  adminUser = {
    ...user,
    permissions: user.permissions ?? [],
  };
}

export function setAdminSession(user: AdminUser): void {
  adminUser = user;
  writeStoredUser(user);
  emit();
}

export function clearAdminSession(): void {
  adminUser = EMPTY_ADMIN_USER;
  loggingOut = false;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

if (typeof window !== "undefined") {
  hydrateAdminSession();
}
