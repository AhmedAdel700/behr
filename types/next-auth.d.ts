import type { PrimaryRole } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/routes";
import type { AdminRole } from "@/types/AdminApiTypes";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    accessTokenIssuedAt?: number;
    error?: string;
    user: {
      id: string;
      roles: string[];
      permissions: string[];
      primaryRole: PrimaryRole;
      appRole: AppRole;
      adminRole?: AdminRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    accessTokenIssuedAt: number;
    roles: string[];
    permissions: string[];
    primaryRole: PrimaryRole;
    appRole: AppRole;
    adminRole?: AdminRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
    accessTokenIssuedAt?: number;
    roles?: string[];
    permissions?: string[];
    primaryRole?: PrimaryRole;
    appRole?: AppRole;
    adminRole?: AdminRole;
    error?: string;
  }
}

export {};
