"use client";

import { logoutAction } from "@/app/actions/auth/authActions";
import {
  beginAdminLogout,
  clearAdminSession,
} from "@/lib/admin/adminSessionStore";

export function performClientLogout(locale: string): void {
  beginAdminLogout();
  clearAdminSession();
  void logoutAction(locale);
}

export function runAdminLogout(locale: string): void {
  performClientLogout(locale);
}
