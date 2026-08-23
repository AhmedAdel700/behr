import type { LoginData, User } from "@/types/AuthTypes";

function extractRoleValue(item: unknown): string {
  if (typeof item === "string") {
    return item;
  }

  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>;

    if (typeof record.slug === "string") {
      return record.slug;
    }

    if (typeof record.name === "string") {
      return record.name;
    }
  }

  return "";
}

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => extractRoleValue(item))
    .filter((role) => role.length > 0);
}

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (typeof item === "object" && item !== null) {
        const record = item as Record<string, unknown>;

        if (typeof record.slug === "string") {
          return record.slug;
        }

        if (typeof record.name === "string") {
          return record.name;
        }
      }

      return "";
    })
    .filter((permission) => permission.length > 0);
}

function normalizeUser(value: unknown): User | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.id !== "number" && typeof record.id !== "string") {
    return null;
  }

  const fullName =
    typeof record.full_name === "string"
      ? record.full_name
      : typeof record.name === "string"
        ? record.name
        : null;

  if (fullName === null || typeof record.email !== "string") {
    return null;
  }

  return {
    id: Number(record.id),
    full_name: fullName,
    email: record.email,
    phone: typeof record.phone === "string" ? record.phone : null,
    fingerprint_number:
      typeof record.fingerprint_number === "number"
        ? record.fingerprint_number
        : null,
    image: typeof record.image === "string" ? record.image : null,
    email_verified_at:
      typeof record.email_verified_at === "string"
        ? record.email_verified_at
        : null,
    branch: typeof record.branch === "string" ? record.branch : null,
    department: typeof record.department === "string" ? record.department : null,
    job_position:
      typeof record.job_position === "string" ? record.job_position : null,
    roles: normalizeRoles(record.roles),
    permissions: normalizePermissions(record.permissions),
    created_at:
      typeof record.created_at === "string" ? record.created_at : "",
    updated_at:
      typeof record.updated_at === "string" ? record.updated_at : "",
  };
}

function normalizeExpiresIn(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeLoginData(value: unknown): LoginData | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const token = typeof record.token === "string" ? record.token : null;
  const tokenType =
    typeof record.token_type === "string" && record.token_type.length > 0
      ? record.token_type
      : "Bearer";
  const expiresIn = normalizeExpiresIn(record.expires_in);
  const user = normalizeUser(record.user);

  if (!token || expiresIn === null || !user) {
    return null;
  }

  return {
    token,
    token_type: tokenType,
    expires_in: expiresIn,
    user,
  };
}

export function isLoginData(value: unknown): value is LoginData {
  return normalizeLoginData(value) !== null;
}

export function parseLoginPayload(payload: string): LoginData | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    return normalizeLoginData(parsed);
  } catch {
    return null;
  }
}

export function parseLoginUserPayload(payload: string): User | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}
