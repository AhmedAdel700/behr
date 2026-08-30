import { parseLocalizedField } from "@/lib/admin/branchLocalizedText";
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
  LeaveRequestCancelResult,
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

function parseLeaveRequestStatus(value: unknown): LeaveRequestStatus {
  if (typeof value !== "string") {
    return "pending";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "pending") {
    return "pending";
  }

  if (normalized === "approved" || normalized === "accepted") {
    return "approved";
  }

  if (normalized === "rejected" || normalized === "declined") {
    return "rejected";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "cancelled";
  }

  return "pending";
}

function resolveReviewMetadata(
  record: Record<string, unknown>,
  approvals: LeaveRequestApproval[],
): {
  reviewer: LeaveRequestReviewerSummary | null;
  reviewedAt: string | null;
  rejectionReason: string;
} {
  const reviewer = mapReviewerSummary(record.reviewer);
  const reviewedAt =
    typeof record.reviewed_at === "string" && record.reviewed_at.trim()
      ? record.reviewed_at
      : null;
  const rejectionReason = normalizeText(record.rejection_reason);

  const actedApproval = approvals.find(
    (approval) =>
      approval.approver !== null &&
      approval.actionAt !== null &&
      approval.status !== "pending",
  );
  const fallbackApproval = approvals.find(
    (approval) => approval.approver !== null,
  );
  const resolvedApproval = actedApproval ?? fallbackApproval;

  return {
    reviewer: reviewer ?? resolvedApproval?.approver ?? null,
    reviewedAt: reviewedAt ?? resolvedApproval?.actionAt ?? null,
    rejectionReason:
      rejectionReason ||
      (parseLeaveRequestStatus(record.status) === "rejected"
        ? resolvedApproval?.comment ?? ""
        : ""),
  };
}

function mapLeaveTypeSummary(
  value: unknown,
  fallbackId: string,
  lang: string,
): LeaveRequestTypeSummary {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  const name = parseLocalizedField(record?.name, lang);
  const description = parseLocalizedField(record?.description, lang);

  return {
    id: id ?? fallbackId,
    name: name.display,
    description: description.display,
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
    status: parseLeaveRequestStatus(record.status),
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

function mapLeaveRequestFromApi(value: unknown, lang: string): LeaveRequestRecord {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  const nestedLeaveType = record ? asRecord(record.leave_type) : null;
  const leaveTypeId =
    (record ? readId(record.leave_type_id) : null) ??
    (nestedLeaveType ? readId(nestedLeaveType.id) : null);

  if (!record || !id || !leaveTypeId) {
    throw new LeaveRequestsApiError("Unexpected leave request response.");
  }

  const approvals = mapApprovals(record.approvals);
  const review = resolveReviewMetadata(record, approvals);

  return {
    id,
    employeeId: readId(record.employee_id) ?? "",
    employee: mapEmployeeSummary(record.employee),
    leaveTypeId,
    leaveType: mapLeaveTypeSummary(record.leave_type, leaveTypeId, lang),
    startAt: normalizeText(record.start_at),
    endAt: normalizeText(record.end_at),
    durationMinutes: parseDuration(record.duration_minutes),
    status: parseLeaveRequestStatus(record.status),
    reason: normalizeText(record.reason),
    reviewer: review.reviewer,
    reviewedAt: review.reviewedAt,
    rejectionReason: review.rejectionReason,
    approvals,
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
    leaveRequests: data.map((item) => mapLeaveRequestFromApi(item, lang)),
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

  return mapLeaveRequestFromApi(data, lang);
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
    leaveRequest: mapLeaveRequestFromApi(data, lang),
  };
}

function buildLeaveRequestFormData(body: LeaveRequestPayload): FormData {
  const formData = new FormData();
  formData.append("leave_type_id", String(body.leave_type_id));
  formData.append("start_at", body.start_at);
  formData.append("end_at", body.end_at);
  formData.append("reason", body.reason);
  return formData;
}

export async function updateLeaveRequestRequest(
  accessToken: string,
  lang: string,
  leaveRequestId: string,
  body: LeaveRequestPayload,
  tokenType = "Bearer",
): Promise<LeaveRequestMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: leaveRequestItemUrl(leaveRequestId),
    accessToken,
    lang,
    tokenType,
    method: "PUT",
    body: buildLeaveRequestFormData(body),
    fallbackMessage: "Failed to update leave request.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to update leave request.");
  }

  const { message, data } = api.assertSuccessResponse<unknown>(
    payload,
    "Failed to update leave request.",
  );

  return {
    message,
    leaveRequest: mapLeaveRequestFromApi(data, lang),
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
    leaveRequest: mapLeaveRequestFromApi(data, lang),
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

export async function cancelLeaveRequestRequest(
  accessToken: string,
  lang: string,
  leaveRequestId: string,
  tokenType = "Bearer",
): Promise<LeaveRequestCancelResult> {
  const fallbackMessage = "Failed to cancel leave request.";
  const { response, payload } = await api.authorizedFetch({
    url: leaveRequestItemUrl(leaveRequestId),
    accessToken,
    lang,
    tokenType,
    method: "DELETE",
    fallbackMessage,
  });

  if (!response.ok) {
    api.throwFromPayload(payload, fallbackMessage);
  }

  api.assertDeleteSuccess(payload, fallbackMessage);

  const message = api.parseDeleteMessage(
    payload,
    fallbackMessage,
    "Leave request cancelled.",
  );
  const payloadRecord = asRecord(payload);
  const data = payloadRecord ? payloadRecord.data : null;

  if (data != null) {
    try {
      return {
        message,
        leaveRequest: mapLeaveRequestFromApi(data, lang),
      };
    } catch {
      // Fall through to a GET so leave-type tags are still loaded.
    }
  }

  try {
    const leaveRequest = await fetchLeaveRequest(
      accessToken,
      lang,
      leaveRequestId,
      tokenType,
    );
    return { message, leaveRequest };
  } catch {
    return { message, leaveRequest: null };
  }
}
