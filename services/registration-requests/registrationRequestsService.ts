import {
  registrationRequestAcceptUrl,
  registrationRequestItemUrl,
  registrationRequestRejectUrl,
  registrationRequestsCollectionUrl,
} from "@services/registration-requests/registrationRequestsPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
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

const api = createApiHttp(
  RegistrationRequestsApiError,
  "registration requests server",
);

function normalizeText(value: string | null | undefined): string {
  return value ?? "";
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
    message: api.parseApiMessage(payload, fallbackMessage),
    request: response.data ? mapRegistrationRequestFromApi(response.data) : null,
  };
}

export async function fetchRegistrationRequests(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: RegistrationRequestsListQueryParams,
): Promise<RegistrationRequestsListResult> {
  const { response, payload } = await api.authorizedFetch({
    url: appendListQueryParams(registrationRequestsCollectionUrl(), params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load registration requests.",
  });

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      api.parseApiMessage(payload, "Failed to load registration requests."),
    );
  }

  const { data } = api.assertSuccessResponse<RegistrationRequestApiRecord[]>(
    payload,
    "Failed to load registration requests.",
  );

  if (!Array.isArray(data)) {
    throw new RegistrationRequestsApiError("Unexpected registration requests response.");
  }

  return {
    requests: data.map(mapRegistrationRequestFromApi),
    meta: api.parsePaginationMeta(payload),
  };
}

export async function fetchRegistrationRequestById(
  accessToken: string,
  lang: string,
  requestId: string,
  tokenType = "Bearer",
): Promise<RegistrationRequestRecord> {
  const { response, payload } = await api.authorizedFetch({
    url: registrationRequestItemUrl(requestId),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load registration request.",
  });

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      api.parseApiMessage(payload, "Failed to load registration request."),
    );
  }

  const { data } = api.assertSuccessResponse<RegistrationRequestApiRecord>(
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
  const { response, payload } = await api.authorizedFetch({
    url: registrationRequestAcceptUrl(requestId),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    fallbackMessage: "Failed to accept registration request.",
  });

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      api.parseApiMessage(payload, "Failed to accept registration request."),
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
  const { response, payload } = await api.authorizedFetch({
    url: registrationRequestRejectUrl(requestId),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body: body ?? {},
    fallbackMessage: "Failed to reject registration request.",
  });

  if (!response.ok) {
    throw new RegistrationRequestsApiError(
      api.parseApiMessage(payload, "Failed to reject registration request."),
    );
  }

  return parseReviewPayload(payload, "Failed to reject registration request.");
}
