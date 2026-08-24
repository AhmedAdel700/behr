import type { NextAuthConfig } from "next-auth";
import {
  getSessionUser,
  mapSessionUserToAdminUser,
} from "@/lib/auth/mapUser";
import {
  REFRESH_ACCESS_TOKEN_ERROR,
  refreshJwtAccessToken,
} from "@/lib/auth/refreshJwtAccessToken";
import { resolveAppRole, resolvePrimaryRole } from "@/lib/auth/roles";
import { getAuthorizedHomePath, canAccessRoute } from "@/lib/auth/routeAccess";
import {
  isAuthRoute,
  isProtectedRoute,
  parseLocalePath,
} from "@/lib/auth/routes";

export const authConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const { locale, pathname: pathWithoutLocale } = parseLocalePath(pathname);
      const sessionUser = getSessionUser(auth);
      const hasRefreshError = auth?.error === REFRESH_ACCESS_TOKEN_ERROR;
      const isLoggedIn = sessionUser !== null && !hasRefreshError;

      if (isProtectedRoute(pathWithoutLocale)) {
        if (!isLoggedIn) {
          return Response.redirect(new URL(`/${locale}/login`, request.url));
        }

        if (!canAccessRoute(pathWithoutLocale, sessionUser)) {
          return Response.redirect(
            new URL(getAuthorizedHomePath(locale, sessionUser), request.url),
          );
        }

        return true;
      }

      if (isAuthRoute(pathWithoutLocale) && isLoggedIn) {
        const homePath = getAuthorizedHomePath(locale, sessionUser);
        const loginPath = `/${locale}/login`;

        if (homePath === loginPath) {
          return true;
        }

        return Response.redirect(new URL(homePath, request.url));
      }

      return true;
    },
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.accessToken = user.accessToken;
        token.tokenType = user.tokenType;
        token.expiresIn = user.expiresIn;
        token.accessTokenIssuedAt = user.accessTokenIssuedAt;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.primaryRole = user.primaryRole;
        token.appRole = user.appRole;
        token.adminRole = user.adminRole;
        token.image = user.image ?? null;
        token.jobPosition = user.jobPosition ?? null;
        token.department = user.department ?? null;
        token.branch = user.branch ?? null;
        delete token.error;
        return token;
      }

      if (trigger === "update" && session) {
        if (typeof session.accessToken === "string") {
          token.accessToken = session.accessToken;
        }

        if (typeof session.tokenType === "string") {
          token.tokenType = session.tokenType;
        }

        if (typeof session.expiresIn === "number") {
          token.expiresIn = session.expiresIn;
        }

        if (typeof session.accessTokenIssuedAt === "number") {
          token.accessTokenIssuedAt = session.accessTokenIssuedAt;
        }

        delete token.error;
        return token;
      }

      return refreshJwtAccessToken(token);
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      if (typeof token.name === "string") {
        session.user.name = token.name;
      }

      if (typeof token.email === "string") {
        session.user.email = token.email;
      }

      session.user.image =
        typeof token.image === "string" && token.image.trim()
          ? token.image
          : null;
      session.user.jobPosition =
        typeof token.jobPosition === "string" && token.jobPosition.trim()
          ? token.jobPosition
          : null;
      session.user.department =
        typeof token.department === "string" && token.department.trim()
          ? token.department
          : null;
      session.user.branch =
        typeof token.branch === "string" && token.branch.trim()
          ? token.branch
          : null;

      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : "";
      session.tokenType =
        typeof token.tokenType === "string" ? token.tokenType : "Bearer";
      session.expiresIn =
        typeof token.expiresIn === "number" ? token.expiresIn : 28_800;
      session.accessTokenIssuedAt =
        typeof token.accessTokenIssuedAt === "number"
          ? token.accessTokenIssuedAt
          : undefined;
      session.error =
        typeof token.error === "string" ? token.error : undefined;
      session.user.roles = Array.isArray(token.roles)
        ? token.roles.filter((role): role is string => typeof role === "string")
        : [];

      const roles = session.user.roles;
      const resolvedPrimaryRole = resolvePrimaryRole(roles);
      const resolvedAppRole = resolveAppRole(roles);

      session.user.permissions = Array.isArray(token.permissions)
        ? token.permissions.filter(
            (permission): permission is string =>
              typeof permission === "string",
          )
        : [];
      session.user.primaryRole =
        token.primaryRole === "super_admin" ||
        token.primaryRole === "department_manager" ||
        token.primaryRole === "employee"
          ? token.primaryRole
          : resolvedPrimaryRole;
      session.user.appRole =
        token.appRole === "admin" || token.appRole === "employee"
          ? token.appRole
          : resolvedAppRole;
      session.user.adminRole =
        token.adminRole === "super_admin" ||
        token.adminRole === "department_manager"
          ? token.adminRole
          : resolvedAppRole === "admin"
            ? resolvedPrimaryRole === "super_admin"
              ? "super_admin"
              : "department_manager"
            : undefined;

      return session;
    },
  },
} satisfies NextAuthConfig;

export { mapSessionUserToAdminUser };
