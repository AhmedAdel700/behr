import { buildJsonHeaders } from "@services/auth/shared";
import {
  leaveRequestApproveUrl,
  leaveRequestItemUrl,
  leaveRequestRejectUrl,
  leaveRequestsCollectionUrl,
} from "@services/leave-requests/leaveRequestsPaths";
import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
import { parseLeaveTypeUnit } from "@/types/LeaveTypesApiTypes";
import type {
  LeaveRequestMutationResult,
  LeaveRequestPayload,
  LeaveRequestRecord,
  LeaveRequestApproval,
  LeaveRequestReviewerSummary,
  LeaveRequestsListQueryParams,
  LeaveRequestsListResult,
  LeaveRequestStatus,
  LeaveRequestTypeSummary,
  RejectLeaveRequestPayload,
} from "@/types/LeaveRequestsApiTypes";
import { LeaveRequestsApiError } from "@/types/LeaveRequestsApiTypes";

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseDuration(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseFieldErrors(payload: unknown): Record<string, string> {
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

function parseApiMessage(payload: unknown, fallback: string): string {
  const firstFieldError = Object.values(parseFieldErrors(payload))[0];
  if (firstFieldError) {
    return firstFieldError;
  }

  const record = asRecord(payload);
  if (record && typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  return fallback;
}

function throwFromPayload(payload: unknown, fallback: string): never {
  throw new LeaveRequestsApiError(parseApiMessage(payload, fallback));
}

function assertSuccessResponse<T>(
  payload: unknown,
  fallbackMessage: string,
): { message: string; data: T } {
  const record = asRecord(payload);
  if (!record || typeof record.success !== "boolean") {
    throw new LeaveRequestsApiError(fallbackMessage);
  }

  const response = record as { success: boolean; message: string; data: T | null };

  if (!response.success || response.data === null) {
    throwFromPayload(payload, fallbackMessage);
  }

  return {
    message: typeof response.message === "string" ? response.message : fallbackMessage,
    data: response.data,
  };
}

function parsePaginationMeta(payload: unknown): BranchesPaginationMeta {
  const record = asRecord(payload);
  const meta = record ? asRecord(record.meta) : null;
  const currentPage = meta ? readPositiveInt(meta.current_page) : null;
  const lastPage = meta ? readPositiveInt(meta.last_page) : null;
  const perPage = meta ? readPositiveInt(meta.per_page) : null;
  const total = meta ? readPositiveInt(meta.total) : null;

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

  return {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  };
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

function wrapNetworkError(error: unknown, fallback: string): never {
  if (error instanceof LeaveRequestsApiError) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new LeaveRequestsApiError(
      "Could not reach the leave requests server. Check CORS/SSL or network.",
    );
  }

  if (error instanceof Error && error.message.includes("fetch failed")) {
    throw new LeaveRequestsApiError(
      "Could not reach the leave requests server. Check SSL certificate or network.",
    );
  }

  throw new LeaveRequestsApiError(fallback);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function isLeaveRequestStatus(value: unknown): value is LeaveRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function mapLeaveTypeSummary(
  value: unknown,
  fallbackId: string,
): LeaveRequestTypeSummary {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;

  return {
    id: id ?? fallbackId,
    name: record ? normalizeText(record.name) : "",
    description: record ? normalizeText(record.description) : "",
    unit: record ? parseLeaveTypeUnit(record.unit) : "day",
  };
}

function mapEmployeeSummary(
  value: unknown,
): LeaveRequestRecord["employee"] {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  if (!record || !id) {
    return null;
  }

  return {
    id,
    fullName: normalizeText(record.full_name),
    email: normalizeText(record.email),
    phone: normalizeText(record.phone),
    fingerprintNumber: readId(record.fingerprint_number) ?? "",
    image:
      typeof record.image === "string" && record.image.trim()
        ? record.image.trim()
        : null,
  };
}

function mapReviewerSummary(value: unknown): LeaveRequestReviewerSummary | null {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  if (!record || !id) {
    return null;
  }

  return {
    id,
    fullName: normalizeText(record.full_name),
  };
}

function mapApproval(value: unknown): LeaveRequestApproval | null {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  if (!record || !id) {
    return null;
  }

  return {
    id,
    leaveRequestId: readId(record.leave_request_id) ?? "",
    approverId: readId(record.approver_id) ?? "",
    approver: mapReviewerSummary(record.approver),
    level: parseDuration(record.level),
    status: isLeaveRequestStatus(record.status) ? record.status : "pending",
    comment: normalizeText(record.comment),
    actionAt:
      typeof record.action_at === "string" && record.action_at.trim()
        ? record.action_at
        : null,
    createdAt: normalizeText(record.created_at),
  };
}

function mapApprovals(value: unknown): LeaveRequestApproval[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => mapApproval(item))
    .filter((item): item is LeaveRequestApproval => item !== null);
}

function mapLeaveRequestFromApi(value: unknown): LeaveRequestRecord {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  const leaveTypeId = record ? readId(record.leave_type_id) : null;

  if (!record || !id || !leaveTypeId) {
    throw new LeaveRequestsApiError("Unexpected leave request response.");
  }

  return {
    id,
    employeeId: readId(record.employee_id) ?? "",
    employee: mapEmployeeSummary(record.employee),
    leaveTypeId,
    leaveType: mapLeaveTypeSummary(record.leave_type, leaveTypeId),
    startAt: normalizeText(record.start_at),
    endAt: normalizeText(record.end_at),
    durationMinutes: parseDuration(record.duration_minutes),
    status: isLeaveRequestStatus(record.status) ? record.status : "pending",
    reason: normalizeText(record.reason),
    reviewer: mapReviewerSummary(record.reviewer),
    reviewedAt:
      typeof record.reviewed_at === "string" && record.reviewed_at.trim()
        ? record.reviewed_at
        : null,
    rejectionReason: normalizeText(record.rejection_reason),
    approvals: mapApprovals(record.approvals),
    createdAt: normalizeText(record.created_at),
    updatedAt: normalizeText(record.updated_at),
  };
}

function buildLeaveRequestsListUrl(params?: LeaveRequestsListQueryParams): string {
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
    ? `${leaveRequestsCollectionUrl()}?${query}`
    : leaveRequestsCollectionUrl();
}

export async function fetchLeaveRequests(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: LeaveRequestsListQueryParams,
): Promise<LeaveRequestsListResult> {
  let response: Response;

  try {
    response = await fetch(buildLeaveRequestsListUrl(params), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load leave requests.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throwFromPayload(payload, "Failed to load leave requests.");
  }

  const { data } = assertSuccessResponse<unknown[]>(
    payload,
    "Failed to load leave requests.",
  );

  if (!Array.isArray(data)) {
    throw new LeaveRequestsApiError("Unexpected leave requests response.");
  }

  return {
    leaveRequests: data.map(mapLeaveRequestFromApi),
    meta: parsePaginationMeta(payload),
  };
}

const MAX_LEAVE_REQUEST_PAGES = 50;

export async function fetchAllLeaveRequests(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<LeaveRequestRecord[]> {
  const collected: LeaveRequestRecord[] = [];
  const seen = new Set<string>();
  let page = 1;
  let lastPage = 1;

  do {
    const result = await fetchLeaveRequests(accessToken, lang, tokenType, {
      page,
    });
    lastPage = Math.max(1, result.meta.last_page);

    for (const leaveRequest of result.leaveRequests) {
      if (seen.has(leaveRequest.id)) {
        continue;
      }

      seen.add(leaveRequest.id);
      collected.push(leaveRequest);
    }

    page += 1;
  } while (page <= lastPage && page <= MAX_LEAVE_REQUEST_PAGES);

  return collected;
}

export async function fetchLeaveRequest(
  accessToken: string,
  lang: string,
  leaveRequestId: string,
  tokenType = "Bearer",
): Promise<LeaveRequestRecord> {
  let response: Response;

  try {
    response = await fetch(leaveRequestItemUrl(leaveRequestId), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load leave request.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throwFromPayload(payload, "Failed to load leave request.");
  }

  const { data } = assertSuccessResponse<unknown>(
    payload,
    "Failed to load leave request.",
  );

  return mapLeaveRequestFromApi(data);
}

export async function createLeaveRequestRequest(
  accessToken: string,
  lang: string,
  body: LeaveRequestPayload,
  tokenType = "Bearer",
): Promise<LeaveRequestMutationResult> {
  let response: Response;

  try {
    response = await fetch(leaveRequestsCollectionUrl(), {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to create leave request.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throwFromPayload(payload, "Failed to create leave request.");
  }

  const { message, data } = assertSuccessResponse<unknown>(
    payload,
    "Failed to create leave request.",
  );

  return {
    message,
    leaveRequest: mapLeaveRequestFromApi(data),
  };
}

async function postLeaveRequestReview(
  url: string,
  accessToken: string,
  lang: string,
  fallback: string,
  tokenType = "Bearer",
  body?: RejectLeaveRequestPayload,
): Promise<LeaveRequestMutationResult> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    wrapNetworkError(error, fallback);
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throwFromPayload(payload, fallback);
  }

  const { message, data } = assertSuccessResponse<unknown>(payload, fallback);

  return {
    message,
    leaveRequest: mapLeaveRequestFromApi(data),
  };
}

export async function approveLeaveRequestRequest(
  accessToken: string,
  lang: string,
  leaveRequestId: string,
  tokenType = "Bearer",
): Promise<LeaveRequestMutationResult> {
  return postLeaveRequestReview(
    leaveRequestApproveUrl(leaveRequestId),
    accessToken,
    lang,
    "Failed to approve leave request.",
    tokenType,
  );
}

export async function rejectLeaveRequestRequest(
  accessToken: string,
  lang: string,
  leaveRequestId: string,
  body: RejectLeaveRequestPayload,
  tokenType = "Bearer",
): Promise<LeaveRequestMutationResult> {
  return postLeaveRequestReview(
    leaveRequestRejectUrl(leaveRequestId),
    accessToken,
    lang,
    "Failed to reject leave request.",
    tokenType,
    body,
  );
}
