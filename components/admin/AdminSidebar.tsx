"use client";

import { useEffect, useState, useSyncExternalStore, type ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";
import { runAdminLogout } from "@/lib/admin/runAdminLogout";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { MainButton } from "@/components/shared/MainButton";
import {
  getAdminSessionSnapshot,
  isAdminLoggingOut,
  subscribeAdminSession,
} from "@/lib/admin/adminSessionStore";
import { getAdminNavItems, type AdminNavItem } from "@/lib/admin/adminNav";
import { useAdminSidebarExpanded } from "@/lib/admin/useAdminSidebarPreference";
import { useAdminMobileDrawerMount, useAdminMobileNav } from "@/lib/admin/adminMobileNav";
import { cn } from "@/lib/utils";
import {
  PENDING_LEAVE_REQUESTS_LIST_PARAMS,
  useGetLeaveRequestsQuery,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import {
  DEFAULT_REGISTRATION_REQUESTS_LIST_PARAMS,
  useGetRegistrationRequestsQuery,
} from "@/app/store/api/registration-requests/registrationRequestsApi";
import type { LeaveRequestsListResult } from "@/types/LeaveRequestsApiTypes";

function pendingLeaveRequestCount(
  result: LeaveRequestsListResult | undefined,
): number {
  if (!result) {
    return 0;
  }

  if (result.meta.total > 0) {
    return result.meta.total;
  }

  return result.leaveRequests.filter(
    (request) => request.status === "pending",
  ).length;
}

function AdminNavLinks({
  expanded,
  onNavigate,
  pendingCounts,
  navItems,
}: {
  expanded: boolean;
  onNavigate?: () => void;
  pendingCounts: Partial<Record<AdminNavItem["key"], number>>;
  navItems: AdminNavItem[];
}): ReactElement {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-3">
      {navItems.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        const badgeCount = pendingCounts[item.key] ?? 0;
        const showBadge = badgeCount > 0;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                expanded ? "justify-start" : "justify-center lg:px-2",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-text-muted hover:bg-surface-muted hover:text-text-secondary"
              )}
              aria-current={active ? "page" : undefined}
              title={expanded ? undefined : t(item.key)}
            >
              <span className="relative shrink-0">
                <Icon
                  className={cn(
                    "size-5",
                    active ? "text-primary-600" : "text-current"
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {showBadge && !expanded ? (
                  <span className="absolute -top-1 -end-1 size-2 rounded-full bg-warning-500" />
                ) : null}
              </span>
              {expanded ? (
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span>{t(item.key)}</span>
                  {showBadge ? (
                    <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-700">
                      {badgeCount}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminSidebar(): ReactElement {
  const t = useTranslations("admin");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { expanded, toggleExpanded, preferenceReady } = useAdminSidebarExpanded();
  const { open: drawerOpen, setOpen: setDrawerOpen } = useAdminMobileNav();
  const mobileDrawerMounted = useAdminMobileDrawerMount(setDrawerOpen);
  const [drawerActivated, setDrawerActivated] = useState(false);
  const sidebarExpanded = preferenceReady ? expanded : true;

  useEffect(() => {
    if (drawerOpen) {
      setDrawerActivated(true);
    }
  }, [drawerOpen]);

  useSyncExternalStore(subscribeAdminSession, getAdminSessionSnapshot, getAdminSessionSnapshot);
  useSyncExternalStore(subscribeAdminSession, isAdminLoggingOut, () => false);
  const admin = getAdminSessionSnapshot();
  const signingOut = isAdminLoggingOut();
  const { data: registrationRequestsResult } =
    useGetRegistrationRequestsQuery(DEFAULT_REGISTRATION_REQUESTS_LIST_PARAMS);
  const { data: leaveRequestsResult } = useGetLeaveRequestsQuery(
    PENDING_LEAVE_REQUESTS_LIST_PARAMS,
  );
  const pendingRegistrationCount = registrationRequestsResult?.meta.total ?? 0;
  const pendingLeaveCount = pendingLeaveRequestCount(leaveRequestsResult);

  const pendingCounts: Partial<Record<AdminNavItem["key"], number>> = {
    registrations: pendingRegistrationCount,
    leaveRequests: pendingLeaveCount,
  };

  const roleLabel =
    admin.role === "super_admin"
      ? t("roles.superAdmin")
      : t("roles.departmentManager");

  const navItems = getAdminNavItems(admin.permissions);

  const CollapseIcon = sidebarExpanded
    ? isRtl
      ? ChevronsRight
      : ChevronsLeft
    : isRtl
      ? ChevronsLeft
      : ChevronsRight;

  const renderCollapseButton = (compact: boolean): ReactElement => (
    <MainButton
      type="button"
      variant="ghost"
      iconOnly
      aria-label={sidebarExpanded ? t("sidebar.collapse") : t("sidebar.expand")}
      onClick={toggleExpanded}
      className={cn(
        "rounded-xl text-text-muted hover:text-text-secondary",
        compact ? "h-auto w-full px-2 py-2.5" : "size-9"
      )}
      startIcon={<CollapseIcon className="size-5" strokeWidth={1.75} />}
    />
  );

  const sidebarContent = (
    showLabels: boolean,
    options?: { showCollapseToggle?: boolean }
  ): ReactElement => (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="border-b border-border pb-4">
        {showLabels ? (
          <div className="rounded-xl bg-surface-muted/60 px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-snug text-ink">
                  {admin.name}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-primary-700">
                  {roleLabel}
                </p>
                {admin.department ? (
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {t(`departments.${admin.department}`)}
                  </p>
                ) : null}
              </div>
              {options?.showCollapseToggle ? renderCollapseButton(false) : null}
            </div>
          </div>
        ) : (
          <div className="px-1">
            {options?.showCollapseToggle ? (
              <span title={admin.name}>{renderCollapseButton(true)}</span>
            ) : null}
          </div>
        )}
      </div>

      <nav aria-label={t("nav.label")} className="min-h-0 flex-1 overflow-y-auto px-1">
        <AdminNavLinks
          expanded={showLabels}
          pendingCounts={pendingCounts}
          navItems={navItems}
          onNavigate={() => setDrawerOpen(false)}
        />
      </nav>

      <div className={cn("mt-auto px-1", showLabels ? "pt-2" : "border-t border-border pt-3")}>
        <MainButton
          type="button"
          variant="ghost-delete"
          block
          iconOnly={!showLabels}
          loading={signingOut}
          onClick={() => {
            setDrawerOpen(false);
            runAdminLogout(locale);
          }}
          className={cn(
            "h-auto rounded-xl px-3 py-2.5 text-sm font-medium",
            showLabels ? "justify-start" : "justify-center lg:px-2",
          )}
          startIcon={<LogOut className="size-5" strokeWidth={1.75} />}
          title={showLabels ? undefined : t("signOut")}
          aria-label={t("signOut")}
        >
          {showLabels ? (signingOut ? t("signingOut") : t("signOut")) : null}
        </MainButton>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 flex-col border-border bg-surface lg:flex",
          "border-e shadow-xs",
          preferenceReady && "transition-[width] duration-200",
          sidebarExpanded ? "w-64 p-3" : "w-16 p-2"
        )}
      >
        {sidebarContent(sidebarExpanded, { showCollapseToggle: true })}
      </aside>

      {mobileDrawerMounted && (drawerOpen || drawerActivated) ? (
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          swipeDirection={isRtl ? "right" : "left"}
        >
          <DrawerContent className="max-w-xs border-border bg-surface p-0 sm:max-w-xs">
            <div className="flex min-h-0 flex-1 flex-col p-3 pt-4">
              {sidebarContent(true)}
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </>
  );
}
