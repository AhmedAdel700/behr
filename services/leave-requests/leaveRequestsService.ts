import {
  leaveRequestApproveUrl,
  leaveRequestItemUrl,
  leaveRequestRejectUrl,
  leaveRequestsCollectionUrl,
} from "@services/leave-requests/leaveRequestsPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
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

const api = createApiHttp(LeaveRequestsApiError, "leave requests server");

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

export async function fetchLeaveRequests(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: LeaveRequestsListQueryParams,
): Promise<LeaveRequestsListResult> {
  const { response, payload } = await api.authorizedFetch({
    url: appendListQueryParams(leaveRequestsCollectionUrl(), params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load leave requests.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load leave requests.");
  }

  const { data } = api.assertSuccessResponse<unknown[]>(
    payload,
    "Failed to load leave requests.",
  );

  if (!Array.isArray(data)) {
    throw new LeaveRequestsApiError("Unexpected leave requests response.");
  }

  return {
    leaveRequests: data.map(mapLeaveRequestFromApi),
    meta: api.parsePaginationMeta(payload),
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
  const { response, payload } = await api.authorizedFetch({
    url: leaveRequestItemUrl(leaveRequestId),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load leave request.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load leave request.");
  }

  const { data } = api.assertSuccessResponse<unknown>(
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
  const { response, payload } = await api.authorizedFetch({
    url: leaveRequestsCollectionUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage: "Failed to create leave request.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to create leave request.");
  }

  const { message, data } = api.assertSuccessResponse<unknown>(
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
  const { response, payload } = await api.authorizedFetch({
    url,
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage: fallback,
  });

  if (!response.ok) {
    api.throwFromPayload(payload, fallback);
  }

  const { message, data } = api.assertSuccessResponse<unknown>(payload, fallback);

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
