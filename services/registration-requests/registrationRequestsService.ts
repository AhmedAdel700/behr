import { buildJsonHeaders } from "@services/auth/shared";
import {
  registrationRequestAcceptUrl,
  registrationRequestItemUrl,
  registrationRequestRejectUrl,
  registrationRequestsCollectionUrl,
} from "@services/registration-requests/registrationRequestsPaths";
import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
import type {
  RegistrationRequestApiRecord,
  RegistrationRequestRecord,
  RegistrationRequestStatus,
  RegistrationRequestsListQueryParams,
  RegistrationRequestsListResult,
  RegistrationReviewResult,
  RejectRegistrationPayload,
} from "@/types/RegistrationRequestsApiTypes";
import { RegistrationRequestsApiError } from "@/types/RegistrationRequestsApiTypes";

function buildAuthorizedHeaders(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): HeadersInit {
  return {
    ...buildJsonHeaders(lang),
    Authorization: `${tokenType} ${accessToken}`,
  };
}

function normalizeText(value: string | null | undefined): string {
  return value ?? "";
}

function parseApiMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

function assertSuccessResponse<T>(
  payload: unknown,
  fallbackMessage: string,
): { message: string; data: T } {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    typeof payload.success !== "boolean"
  ) {
    throw new RegistrationRequestsApiError(fallbackMessage);
  }

  const response = payload as {
    success: boolean;
    message: string;
    data: T | null;
  };

  if (!response.success || response.data === null) {
    throw new RegistrationRequestsApiError(response.message || fallbackMessage);
  }

  return {
    message: response.message,
    data: response.data,
  };
}

function parsePaginationMeta(payload: unknown): BranchesPaginationMeta {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "meta" in payload &&
    typeof payload.meta === "object" &&
    payload.meta !== null
  ) {
    const meta = payload.meta as Record<string, unknown>;
    if (
      typeof meta.current_page === "number" &&
      typeof meta.last_page === "number" &&
      typeof meta.per_page === "number" &&
      typeof meta.total === "number"
    ) {
      return {
        current_page: meta.current_page,
        last_page: meta.last_page,
        per_page: meta.per_page,
        total: meta.total,
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

function wrapNetworkError(error: unknown, fallback: string): never {
  if (error instanceof RegistrationRequestsApiError) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new RegistrationRequestsApiError(
      "Could not reach the registration requests server. Check CORS/SSL or network.",
    );
  }

  if (error instanceof Error && error.message.includes("fetch failed")) {
    throw new RegistrationRequestsApiError(
      "Could not reach the registration requests server. Check SSL certificate or network.",
    );
  }

  throw new RegistrationRequestsApiError(fallback);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function parseStatus(value: string): RegistrationRequestStatus {
  if (value === "accepted" || value === "rejected" || value === "pending") {
    return value;
  }

  if (value === "approved") {
    return "accepted";
  }

  return "pending";
}

export function mapRegistrationRequestFromApi(
  record: RegistrationRequestApiRecord,
): RegistrationRequestRecord {
  return {
    id: String(record.id),
    name: normalizeText(record.full_name),
    email: normalizeText(record.email),
    phone: normalizeText(record.phone),
    fingerprintNumber: normalizeText(record.fingerprint_number),
    image: record.image,
    status: parseStatus(record.status),
    rejectionReason: normalizeText(record.rejection_reason),
    branchName: normalizeText(record.branch?.name),
    departmentName: normalizeText(record.department?.name),
    positionName: normalizeText(record.job_position?.name),
    reviewerName: normalizeText(record.reviewer?.full_name),
    userName: normalizeText(record.user?.full_name),
    userEmail: normalizeText(record.user?.email),
    reviewedAt: record.reviewed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function buildRegistrationRequestsListUrl(
  params?: RegistrationRequestsListQueryParams,
): string {
  const searchParams = new URLSearchParams();
  const search = params?.search?.trim();

  if (search) {
    searchParams.set("search", search);
  }

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  if (params?.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query
    ? `${registrationRequestsCollectionUrl()}?${query}`
    : registrationRequestsCollectionUrl();
}

function parseReviewPayload(
  payload: unknown,
  fallbackMessage: string,
): RegistrationReviewResult {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    typeof payload.success !== "boolean"
  ) {
    throw new RegistrationRequestsApiError(fallbackMessage);
  }

  const response = payload as {
    success: boolean;
    message: string;
    data: RegistrationRequestApiRecord | null;
  };

  if (!response.success) {
    throw new RegistrationRequestsApiError(response.message || fallbackMessage);
  }

  return {
    message: parseApiMessage(payload, fallbackMessage),
    request: response.data ? mapRegistrationRequestFromApi(response.data) : null,
  };
}

export async function fetchRegistrationRequests(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: RegistrationRequestsListQueryParams,
): Promise<RegistrationRequestsListResult> {
  let response: Response;

  try {
    response = await fetch(buildRegistrationRequestsListUrl(params), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load registration requests.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      parseApiMessage(payload, "Failed to load registration requests."),
    );
  }

  const { data } = assertSuccessResponse<RegistrationRequestApiRecord[]>(
    payload,
    "Failed to load registration requests.",
  );

  if (!Array.isArray(data)) {
    throw new RegistrationRequestsApiError("Unexpected registration requests response.");
  }

  return {
    requests: data.map(mapRegistrationRequestFromApi),
    meta: parsePaginationMeta(payload),
  };
}

export async function fetchRegistrationRequestById(
  accessToken: string,
  lang: string,
  requestId: string,
  tokenType = "Bearer",
): Promise<RegistrationRequestRecord> {
  let response: Response;

  try {
    response = await fetch(registrationRequestItemUrl(requestId), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load registration request.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      parseApiMessage(payload, "Failed to load registration request."),
    );
  }

  const { data } = assertSuccessResponse<RegistrationRequestApiRecord>(
    payload,
    "Failed to load registration request.",
  );

  return mapRegistrationRequestFromApi(data);
}

export async function acceptRegistrationRequest(
  accessToken: string,
  lang: string,
  requestId: string,
  tokenType = "Bearer",
): Promise<RegistrationReviewResult> {
  let response: Response;

  try {
    response = await fetch(registrationRequestAcceptUrl(requestId), {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to accept registration request.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      parseApiMessage(payload, "Failed to accept registration request."),
    );
  }

  return parseReviewPayload(payload, "Failed to accept registration request.");
}

export async function rejectRegistrationRequest(
  accessToken: string,
  lang: string,
  requestId: string,
  body?: RejectRegistrationPayload,
  tokenType = "Bearer",
): Promise<RegistrationReviewResult> {
  let response: Response;

  try {
    response = await fetch(registrationRequestRejectUrl(requestId), {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body ?? {}),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to reject registration request.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      parseApiMessage(payload, "Failed to reject registration request."),
    );
  }

  return parseReviewPayload(payload, "Failed to reject registration request.");
}
