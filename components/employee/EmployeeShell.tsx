"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";
import { EmployeeTabBar } from "@/components/employee/EmployeeTabBar";
import type { SidebarUserInfo } from "@/lib/auth/sidebarUser";
import { canSwitchDashboards, type PrimaryRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export function EmployeeShell({
  children,
  className,
  primaryRole,
  sidebarUser,
}: {
  children: ReactNode;
  className?: string;
  primaryRole?: PrimaryRole;
  sidebarUser?: SidebarUserInfo;
}) {
  const t = useTranslations("employee");
  const pathname = usePathname();
  const showManagerSwitch = primaryRole
    ? canSwitchDashboards(primaryRole)
    : false;

  let title = t("tabs.home");
  if (pathname.startsWith("/attendance")) title = t("attendance.title");
  else if (pathname.startsWith("/requests/new")) title = t("requests.new");
  else if (/^\/requests\/[^/]+$/.test(pathname)) title = t("requests.detail");
  else if (pathname.startsWith("/requests")) title = t("requests.title");
  else if (pathname.startsWith("/profile")) title = t("profile.title");

  const roleLabel = showManagerSwitch
    ? t("roles.departmentManager")
    : t("roles.employee");

  return (
    <div className={cn("relative min-h-dvh bg-surface-sunken", className)}>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4 lg:max-w-5xl">
          <div className="inline-flex min-w-0 items-center gap-2.5">
            <BrandLogo size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{title}</p>
              <p className="truncate text-[11px] text-text-muted">{roleLabel}</p>
            </div>
          </div>
          <LocaleSwitcher tone="light" className="shrink-0" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg items-start gap-5 px-4 pb-28 pt-5 lg:max-w-5xl lg:gap-6 lg:pb-6 lg:pt-6">
        <EmployeeTabBar initialUser={sidebarUser} primaryRole={primaryRole} />
        <main className="min-w-0 flex-1 lg:pt-1">{children}</main>
      </div>
    </div>
  );
}
