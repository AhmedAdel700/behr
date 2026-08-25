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
  profile: "/auth/profile",
  refresh: "/auth/refresh",
  register: "/auth/register",
} as const;

export function buildAuthApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAuthApiBaseUrl()}${normalizedPath}`;
}

export const LANG_HEADER = "lang";
export const DEFAULT_LANG = "en";

export function normalizeLangHeader(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_LANG;
}

export function applyLangHeader(headers: Headers, lang: string): void {
  headers.set(LANG_HEADER, normalizeLangHeader(lang));
}

export function buildAuthHeaders(
  accessToken: string,
  lang: string,
): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    [LANG_HEADER]: normalizeLangHeader(lang),
  };
}

export function buildJsonHeaders(lang: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    [LANG_HEADER]: normalizeLangHeader(lang),
  };
}

export function buildAuthorizedHeaders(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): HeadersInit {
  return {
    ...buildJsonHeaders(lang),
    Authorization: `${tokenType} ${accessToken}`,
  };
}
