"use client";

import { logoutAction } from "@/app/actions/auth/authActions";
import { beginAdminLogout } from "@/lib/admin/adminSessionStore";

export function runAdminLogout(locale: string): void {
  beginAdminLogout();
  void logoutAction(locale);
}
