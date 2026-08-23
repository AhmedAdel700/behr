export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim().replace(
    /^["']|["']$/g,
    "",
  );

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

export function getAuthApiBaseUrl(): string {
  const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL?.trim().replace(
    /^["']|["']$/g,
    "",
  );

  if (authBaseUrl) {
    return authBaseUrl.replace(/\/$/, "");
  }

  return getApiBaseUrl();
}

export const authApiPaths = {
  login: "/auth/login",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
} as const;

export function buildAuthApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAuthApiBaseUrl()}${normalizedPath}`;
}

export function buildAuthHeaders(
  accessToken: string,
  lang: string,
): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    lang,
  };
}

export function buildJsonHeaders(lang: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    lang,
  };
}
