import { buildJsonHeaders } from "@services/auth/shared";
import {
  leaveTypeItemUrl,
  leaveTypesCollectionUrl,
} from "@services/leave-types/leaveTypesPaths";
import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
import type {
  LeaveTypeApiRecord,
  LeaveTypeDeleteResult,
  LeaveTypeMutationResult,
  LeaveTypePayload,
  LeaveTypeRecord,
  LeaveTypesListQueryParams,
  LeaveTypesListResult,
} from "@/types/LeaveTypesApiTypes";
import { LeaveTypesApiError } from "@/types/LeaveTypesApiTypes";

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
  if (typeof payload !== "object" || payload === null) {
    return fallback;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.errors === "object" && record.errors !== null) {
    const errors = record.errors as Record<string, unknown>;
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
      if (typeof value === "string") {
        return value;
      }
    }
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
    throw new LeaveTypesApiError(fallbackMessage);
  }

  const response = payload as {
    success: boolean;
    message: string;
    data: T | null;
  };

  if (!response.success || response.data === null) {
    throw new LeaveTypesApiError(response.message || fallbackMessage);
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
  if (error instanceof LeaveTypesApiError) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new LeaveTypesApiError(
      "Could not reach the leave types server. Check CORS/SSL or network.",
    );
  }

  if (error instanceof Error && error.message.includes("fetch failed")) {
    throw new LeaveTypesApiError(
      "Could not reach the leave types server. Check SSL certificate or network.",
    );
  }

  throw new LeaveTypesApiError(fallback);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function parseCount(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isLeaveTypeUnit(value: unknown): value is LeaveTypeApiRecord["unit"] {
  return value === "day" || value === "hour";
}

function isLeaveTypeAllocationType(
  value: unknown,
): value is LeaveTypeApiRecord["allocation_type"] {
  return value === "yearly" || value === "monthly" || value === "none";
}

function isLeaveTypeGenderRestriction(
  value: unknown,
): value is LeaveTypeApiRecord["gender_restriction"] {
  return value === "none" || value === "female" || value === "male";
}

function mapLeaveTypeFromApi(record: LeaveTypeApiRecord): LeaveTypeRecord {
  return {
    id: String(record.id),
    name: normalizeText(record.name),
    description: normalizeText(record.description),
    unit: isLeaveTypeUnit(record.unit) ? record.unit : "day",
    allocationType: isLeaveTypeAllocationType(record.allocation_type)
      ? record.allocation_type
      : "none",
    allocationAmount: record.allocation_amount,
    canCarryForward: Boolean(record.can_carry_forward),
    carryForwardLimit: record.carry_forward_limit,
    isPaid: Boolean(record.is_paid),
    requiresApproval: Boolean(record.requires_approval),
    genderRestriction: isLeaveTypeGenderRestriction(record.gender_restriction)
      ? record.gender_restriction
      : "none",
    isActive: Boolean(record.is_active),
    leaveRequestsCount: parseCount(record.leave_requests_count),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function buildLeaveTypesListUrl(params?: LeaveTypesListQueryParams): string {
  const searchParams = new URLSearchParams();
  const search = params?.search?.trim();

  if (search) {
    searchParams.set("search", search);
  }

  if (params?.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query
    ? `${leaveTypesCollectionUrl()}?${query}`
    : leaveTypesCollectionUrl();
}

export async function fetchLeaveTypes(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: LeaveTypesListQueryParams,
): Promise<LeaveTypesListResult> {
  let response: Response;

  try {
    response = await fetch(buildLeaveTypesListUrl(params), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load leave types.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new LeaveTypesApiError(
      parseApiMessage(payload, "Failed to load leave types."),
    );
  }

  const { data } = assertSuccessResponse<LeaveTypeApiRecord[]>(
    payload,
    "Failed to load leave types.",
  );

  if (!Array.isArray(data)) {
    throw new LeaveTypesApiError("Unexpected leave types response.");
  }

  return {
    leaveTypes: data.map(mapLeaveTypeFromApi),
    meta: parsePaginationMeta(payload),
  };
}

export async function fetchLeaveType(
  accessToken: string,
  lang: string,
  leaveTypeId: string,
  tokenType = "Bearer",
): Promise<LeaveTypeRecord> {
  let response: Response;

  try {
    response = await fetch(leaveTypeItemUrl(leaveTypeId), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load leave type.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new LeaveTypesApiError(
      parseApiMessage(payload, "Failed to load leave type."),
    );
  }

  const { data } = assertSuccessResponse<LeaveTypeApiRecord>(
    payload,
    "Failed to load leave type.",
  );

  return mapLeaveTypeFromApi(data);
}

export async function createLeaveTypeRequest(
  accessToken: string,
  lang: string,
  body: LeaveTypePayload,
  tokenType = "Bearer",
): Promise<LeaveTypeMutationResult> {
  let response: Response;

  try {
    response = await fetch(leaveTypesCollectionUrl(), {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to create leave type.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new LeaveTypesApiError(
      parseApiMessage(payload, "Failed to create leave type."),
    );
  }

  const { message, data } = assertSuccessResponse<LeaveTypeApiRecord>(
    payload,
    "Failed to create leave type.",
  );

  return {
    message,
    leaveType: mapLeaveTypeFromApi(data),
  };
}

export async function updateLeaveTypeRequest(
  accessToken: string,
  lang: string,
  leaveTypeId: string,
  body: LeaveTypePayload,
  tokenType = "Bearer",
): Promise<LeaveTypeMutationResult> {
  let response: Response;

  try {
    response = await fetch(leaveTypeItemUrl(leaveTypeId), {
      method: "PUT",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to update leave type.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new LeaveTypesApiError(
      parseApiMessage(payload, "Failed to update leave type."),
    );
  }

  const { message, data } = assertSuccessResponse<LeaveTypeApiRecord>(
    payload,
    "Failed to update leave type.",
  );

  return {
    message,
    leaveType: mapLeaveTypeFromApi(data),
  };
}

export async function deleteLeaveTypeRequest(
  accessToken: string,
  lang: string,
  leaveTypeId: string,
  tokenType = "Bearer",
): Promise<LeaveTypeDeleteResult> {
  let response: Response;

  try {
    response = await fetch(leaveTypeItemUrl(leaveTypeId), {
      method: "DELETE",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to delete leave type.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new LeaveTypesApiError(
      parseApiMessage(payload, "Failed to delete leave type."),
    );
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === false
  ) {
    throw new LeaveTypesApiError(
      parseApiMessage(payload, "Failed to delete leave type."),
    );
  }

  return {
    message: parseApiMessage(payload, "Leave type deleted successfully."),
  };
}
