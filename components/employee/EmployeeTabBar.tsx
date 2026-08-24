"use client";

import { type ReactElement } from "react";
import { CalendarClock, FileText, Home, UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ProfileAvatar } from "@/components/shared/AvatarUpload";
import {
  getSidebarDisplayName,
  getSidebarRoleLabel,
  getSidebarUserInfo,
  type SidebarUserInfo,
} from "@/lib/auth/sidebarUser";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/",
    key: "home",
    icon: Home,
    match: (p: string) => p === "/" || p === "",
  },
  {
    href: "/requests",
    key: "requests",
    icon: FileText,
    match: (p: string) => p.startsWith("/requests"),
  },
  {
    href: "/attendance",
    key: "attendance",
    icon: CalendarClock,
    match: (p: string) => p.startsWith("/attendance"),
    comingSoon: true,
  },
  {
    href: "/profile",
    key: "profile",
    icon: UserRound,
    match: (p: string) => p.startsWith("/profile"),
  },
] as const;

export function EmployeeTabBar({
  initialUser,
}: {
  initialUser?: SidebarUserInfo;
}): ReactElement {
  const t = useTranslations("employee");
  const tTabs = useTranslations("employee.tabs");
  const pathname = usePathname();
  const { data: session } = useSession();
  const user =
    session?.user?.id
      ? getSidebarUserInfo(session)
      : (initialUser ?? getSidebarUserInfo(null));
  const displayName = getSidebarDisplayName(user);
  const roleLabel = getSidebarRoleLabel(user, t("roles.employee"));

  return (
    <aside
      className={cn(
        "z-40 border-border bg-surface/95",
        // Mobile: fixed bottom bar
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:border-t max-lg:backdrop-blur-md",
        "max-lg:pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        // lg+: sticky card sidebar under the header
        "lg:sticky lg:top-20 lg:self-start lg:z-auto lg:flex lg:h-[calc(100dvh-5.5rem)] lg:w-60 lg:shrink-0 lg:flex-col",
        "lg:rounded-2xl lg:border lg:bg-surface lg:p-3 lg:shadow-xs"
      )}
    >
      <div className="mb-4 hidden items-center gap-3 px-2 pb-4 pt-1.5 lg:flex lg:border-b lg:border-border">
        <ProfileAvatar
          src={user.imageSrc}
          alt={displayName}
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full object-cover ring-2 ring-primary-100"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink lg:text-base">
            {displayName}
          </p>
          <p className="truncate text-[12px] text-text-muted lg:text-sm">
            {roleLabel}
          </p>
        </div>
      </div>

      <nav aria-label="Employee" className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <ul
          className={cn(
            "mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-2",
            "lg:mx-0 lg:flex lg:h-full lg:max-w-none lg:flex-col lg:gap-1.5 lg:p-0"
          )}
        >
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;

            return (
              <li
                key={tab.href}
                className={tab.key === "profile" ? "lg:mt-auto" : undefined}
              >
                <Link
                  href={tab.href}
                  prefetch
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
                    "lg:flex-row lg:gap-3 lg:px-3.5 lg:py-3 lg:text-base",
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-text-muted hover:bg-surface-muted hover:text-text-secondary"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0 lg:size-[1.35rem]",
                      active ? "text-primary-600" : "text-current"
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  <span className="flex flex-col items-center gap-0.5 lg:flex-row lg:items-center lg:gap-2">
                    <span>{tTabs(tab.key)}</span>
                    {"comingSoon" in tab && tab.comingSoon ? (
                      <span className="rounded bg-warning-50 px-1 py-px text-[9px] font-semibold text-warning-800 lg:text-[10px]">
                        {tTabs("soon")}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
