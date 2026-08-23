import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { mapBackendUserToAuthUser } from "@/lib/auth/mapUser";
import { parseLoginUserPayload } from "@services/auth/normalizeLoginData";

function parseExpiresIn(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
        tokenType: { label: "Token Type", type: "text" },
        expiresIn: { label: "Expires In", type: "text" },
        userJson: { label: "User JSON", type: "text" },
      },
      authorize: async (credentials) => {
        const accessToken =
          typeof credentials?.accessToken === "string"
            ? credentials.accessToken
            : "";
        const tokenType =
          typeof credentials?.tokenType === "string" &&
          credentials.tokenType.length > 0
            ? credentials.tokenType
            : "Bearer";
        const expiresIn = parseExpiresIn(credentials?.expiresIn);
        const userJson =
          typeof credentials?.userJson === "string" ? credentials.userJson : "";

        if (!accessToken || !userJson || expiresIn === null) {
          return null;
        }

        const user = parseLoginUserPayload(userJson);

        if (!user) {
          return null;
        }

        return mapBackendUserToAuthUser(
          user,
          accessToken,
          tokenType,
          expiresIn,
        );
      },
    }),
  ],
});
