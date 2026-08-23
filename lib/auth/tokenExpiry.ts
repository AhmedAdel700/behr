export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 28_800;
export const REFRESH_BUFFER_SECONDS = 180;

function resolveExpiresIn(expiresIn: number | undefined): number {
  if (typeof expiresIn === "number" && expiresIn > 0) {
    return expiresIn;
  }

  return DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
}

function resolveIssuedAt(accessTokenIssuedAt: number | undefined): number {
  if (typeof accessTokenIssuedAt === "number" && accessTokenIssuedAt > 0) {
    return accessTokenIssuedAt;
  }

  return Date.now();
}

export function isAccessTokenStale(
  accessTokenIssuedAt: number | undefined,
  expiresIn?: number,
): boolean {
  const issuedAt = resolveIssuedAt(accessTokenIssuedAt);
  const ttl = resolveExpiresIn(expiresIn);
  const refreshAt = issuedAt + (ttl - REFRESH_BUFFER_SECONDS) * 1000;

  return Date.now() >= refreshAt;
}

export function isAccessTokenExpired(
  accessTokenIssuedAt: number | undefined,
  expiresIn?: number,
): boolean {
  const issuedAt = resolveIssuedAt(accessTokenIssuedAt);
  const ttl = resolveExpiresIn(expiresIn);
  const expiresAt = issuedAt + ttl * 1000;

  return Date.now() >= expiresAt;
}
