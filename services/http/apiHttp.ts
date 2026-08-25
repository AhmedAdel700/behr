import {
  buildAuthorizedHeaders,
  buildJsonHeaders,
} from "@services/auth/shared";
import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";

export type ApiErrorConstructor = new (
  message: string,
  fieldErrors?: Record<string, string>,
) => Error;

export interface AuthorizedFetchOptions {
  url: string;
  lang: string;
  fallbackMessage: string;
  accessToken?: string;
  tokenType?: string;
  method?: string;
  body?: unknown;
  cache?: RequestCache;
  useJsonHeadersOnly?: boolean;
}

export interface ApiHttpClient {
  parseApiMessage: (payload: unknown, fallback: string) => string;
  parseFieldErrors: (payload: unknown) => Record<string, string>;
  parsePaginationMeta: (payload: unknown) => BranchesPaginationMeta;
  readJsonPayload: (response: Response) => Promise<unknown>;
  assertSuccessResponse: <T>(
    payload: unknown,
    fallbackMessage: string,
  ) => { message: string; data: T };
  throwFromPayload: (payload: unknown, fallback: string) => never;
  wrapNetworkError: (
    error: unknown,
    fallback: string,
    resourceLabel?: string,
  ) => never;
  authorizedFetch: (
    options: AuthorizedFetchOptions,
  ) => Promise<{ response: Response; payload: unknown }>;
  parseDeleteMessage: (
    payload: unknown,
    fallback: string,
    successMessage: string,
  ) => string;
  assertDeleteSuccess: (
    payload: unknown,
    fallback: string,
  ) => void;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function readPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function parseFieldErrors(payload: unknown): Record<string, string> {
  const record = asRecord(payload);
  if (!record || typeof record.errors !== "object" || record.errors === null) {
    return {};
  }

  const errors = record.errors as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      fieldErrors[key] = value[0];
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      fieldErrors[key] = value;
    }
  }

  return fieldErrors;
}

export function parseApiMessage(payload: unknown, fallback: string): string {
  const fieldErrors = parseFieldErrors(payload);
  const firstFieldError = Object.values(fieldErrors)[0];
  if (firstFieldError) {
    return firstFieldError;
  }

  const record = asRecord(payload);
  if (record && typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  return fallback;
}

export function parsePaginationMeta(payload: unknown): BranchesPaginationMeta {
  const record = asRecord(payload);
  const meta = record ? asRecord(record.meta) : null;

  if (meta) {
    const currentPage = readPositiveInt(meta.current_page);
    const lastPage = readPositiveInt(meta.last_page);
    const perPage = readPositiveInt(meta.per_page);
    const total = readPositiveInt(meta.total);

    if (
      currentPage !== null &&
      lastPage !== null &&
      perPage !== null &&
      total !== null
    ) {
      return {
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total,
      };
    }
  }

  return {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  };
}

export async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export function createApiHttp(
  ErrorClass: ApiErrorConstructor,
  resourceLabel = "server",
): ApiHttpClient {
  function throwFromPayload(payload: unknown, fallback: string): never {
    throw new ErrorClass(parseApiMessage(payload, fallback), parseFieldErrors(payload));
  }

  function assertSuccessResponse<T>(
    payload: unknown,
    fallbackMessage: string,
  ): { message: string; data: T } {
    const record = asRecord(payload);

    if (
      !record ||
      !("success" in record) ||
      typeof record.success !== "boolean"
    ) {
      throw new ErrorClass(fallbackMessage);
    }

    const response = record as {
      success: boolean;
      message: string;
      data: T | null;
    };

    if (!response.success || response.data === null) {
      throwFromPayload(payload, fallbackMessage);
    }

    return {
      message: response.message,
      data: response.data,
    };
  }

  function wrapNetworkError(
    error: unknown,
    fallback: string,
    label = resourceLabel,
  ): never {
    if (error instanceof ErrorClass) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ErrorClass(
        `Could not reach the ${label}. Check CORS/SSL or network.`,
      );
    }

    if (error instanceof Error && error.message.includes("fetch failed")) {
      throw new ErrorClass(
        `Could not reach the ${label}. Check SSL certificate or network.`,
      );
    }

    throw new ErrorClass(fallback);
  }

  async function authorizedFetch(
    options: AuthorizedFetchOptions,
  ): Promise<{ response: Response; payload: unknown }> {
    const {
      url,
      lang,
      fallbackMessage,
      accessToken,
      tokenType = "Bearer",
      method = "GET",
      body,
      cache,
      useJsonHeadersOnly = false,
    } = options;

    const headers = useJsonHeadersOnly
      ? buildJsonHeaders(lang)
      : buildAuthorizedHeaders(accessToken ?? "", lang, tokenType);

    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: cache ?? (method === "GET" ? "no-store" : undefined),
      });
    } catch (error) {
      wrapNetworkError(error, fallbackMessage);
    }

    const payload = await readJsonPayload(response);
    return { response, payload };
  }

  function parseDeleteMessage(
    payload: unknown,
    fallback: string,
    successMessage: string,
  ): string {
    return parseApiMessage(payload, successMessage || fallback);
  }

  function assertDeleteSuccess(payload: unknown, fallback: string): void {
    const record = asRecord(payload);

    if (record && "success" in record && record.success === false) {
      throwFromPayload(payload, fallback);
    }
  }

  return {
    parseApiMessage,
    parseFieldErrors,
    parsePaginationMeta,
    readJsonPayload,
    assertSuccessResponse,
    throwFromPayload,
    wrapNetworkError,
    authorizedFetch,
    parseDeleteMessage,
    assertDeleteSuccess,
  };
}
