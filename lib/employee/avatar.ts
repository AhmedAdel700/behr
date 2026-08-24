const REMOTE_AVATAR_PREFIXES = ["http://", "https://", "/"];

export function isRemoteAvatarSrc(src: string): boolean {
  return REMOTE_AVATAR_PREFIXES.some((prefix) => src.startsWith(prefix));
}

export function resolveAvatarSrc(src: string | null | undefined): string | null {
  if (typeof src !== "string") {
    return null;
  }

  const trimmed = src.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/storage/") || trimmed === "/storage") {
    return prefixBackendOrigin(trimmed);
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return prefixBackendOrigin(`/storage/${trimmed}`);
}

function prefixBackendOrigin(path: string): string {
  const origin = getBackendOrigin();
  if (!origin) {
    return path;
  }

  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function getBackendOrigin(): string | null {
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim();
  if (!base) {
    return null;
  }

  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}
