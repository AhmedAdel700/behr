import { routing } from "@/i18n/routing";

export type AppRole = "admin" | "employee";

export interface ParsedLocalePath {
  locale: string;
  pathname: string;
}

export function parseLocalePath(pathname: string): ParsedLocalePath {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && routing.locales.includes(maybeLocale as "ar" | "en")) {
    const rest = segments.slice(1);
    return {
      locale: maybeLocale,
      pathname: rest.length > 0 ? `/${rest.join("/")}` : "/",
    };
  }

  return {
    locale: routing.defaultLocale,
    pathname: pathname || "/",
  };
}

export function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

export function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin-dashboard" || pathname.startsWith("/admin-dashboard/");
}

export function isEmployeeRoute(pathname: string): boolean {
  if (isAdminRoute(pathname) || isAuthRoute(pathname)) {
    return false;
  }

  return (
    pathname === "/" ||
    pathname === "/attendance" ||
    pathname === "/profile" ||
    pathname === "/requests" ||
    pathname.startsWith("/requests/")
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return isAdminRoute(pathname) || isEmployeeRoute(pathname);
}

export function homePathForRole(locale: string, appRole: AppRole): string {
  return appRole === "admin" ? `/${locale}/admin-dashboard` : `/${locale}`;
}

export function loginPath(locale: string): URL {
  return new URL(`/${locale}/login`, "http://local");
}
