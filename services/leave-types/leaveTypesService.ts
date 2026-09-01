import { parseLocalizedField } from "@/lib/admin/branchLocalizedText";
import {
  leaveTypeItemUrl,
  leaveTypesCollectionUrl,
} from "@services/leave-types/leaveTypesPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
import {
  parseApiBoolean,
  parseApiCount,
  parseApiNumber,
} from "@services/http/parseApiValues";
import {
  LeaveTypesApiError,
  parseLeaveTypeUnit,
  type LeaveTypeAllocationType,
  type LeaveTypeApiRecord,
  type LeaveTypeDeleteResult,
  type LeaveTypeGenderRestriction,
  type LeaveTypeMutationResult,
  type LeaveTypePayload,
  type LeaveTypeRecord,
  type LeaveTypesListQueryParams,
  type LeaveTypesListResult,
} from "@/types/LeaveTypesApiTypes";

const api = createApiHttp(LeaveTypesApiError, "leave types server");

function isLeaveTypeAllocationType(
  value: unknown,
): value is LeaveTypeAllocationType {
  return value === "yearly" || value === "monthly" || value === "none";
}

function isLeaveTypeGenderRestriction(
  value: unknown,
): value is LeaveTypeGenderRestriction {
  return value === "none" || value === "female" || value === "male";
}

function mapLeaveTypeFromApi(
  record: LeaveTypeApiRecord,
  lang: string,
): LeaveTypeRecord {
  const name = parseLocalizedField(record.name, lang);
  const description = parseLocalizedField(record.description, lang);

  return {
    id: String(record.id),
    name: name.display,
    description: description.display,
    nameLocalized: name.localized,
    descriptionLocalized: description.localized,
    unit: parseLeaveTypeUnit(record.unit),
    allocationType: isLeaveTypeAllocationType(record.allocation_type)
      ? record.allocation_type
      : "none",
    allocationAmount: parseApiNumber(record.allocation_amount),
    canCarryForward: parseApiBoolean(record.can_carry_forward),
    carryForwardLimit:
      record.carry_forward_limit === null
        ? null
        : parseApiNumber(record.carry_forward_limit),
    isPaid: parseApiBoolean(record.is_paid),
    requiresApproval: parseApiBoolean(record.requires_approval),
    genderRestriction: isLeaveTypeGenderRestriction(record.gender_restriction)
      ? record.gender_restriction
      : "none",
    isActive: parseApiBoolean(record.is_active),
    leaveRequestsCount: parseApiCount(record.leave_requests_count),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function fetchLeaveTypes(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: LeaveTypesListQueryParams,
): Promise<LeaveTypesListResult> {
  const { response, payload } = await api.authorizedFetch({
    url: appendListQueryParams(leaveTypesCollectionUrl(), params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load leave types.",
  });

  if (!response.ok) {
    throw new LeaveTypesApiError(
      api.parseApiMessage(payload, "Failed to load leave types."),
    );
  }

  const { data } = api.assertSuccessResponse<LeaveTypeApiRecord[]>(
    payload,
    "Failed to load leave types.",
  );

  if (!Array.isArray(data)) {
    throw new LeaveTypesApiError("Unexpected leave types response.");
  }

  return {
    leaveTypes: data.map((record) => mapLeaveTypeFromApi(record, lang)),
    meta: api.parsePaginationMeta(payload),
  };
}

export async function fetchLeaveType(
  accessToken: string,
  lang: string,
  leaveTypeId: string,
  tokenType = "Bearer",
): Promise<LeaveTypeRecord> {
  const { response, payload } = await api.authorizedFetch({
    url: leaveTypeItemUrl(leaveTypeId),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load leave type.",
  });

  if (!response.ok) {
    throw new LeaveTypesApiError(
      api.parseApiMessage(payload, "Failed to load leave type."),
    );
  }

  const { data } = api.assertSuccessResponse<LeaveTypeApiRecord>(
    payload,
    "Failed to load leave type.",
  );

  return mapLeaveTypeFromApi(data, lang);
}

const MAX_LEAVE_TYPE_PAGES = 50;

export async function fetchAllLeaveTypes(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
): Promise<LeaveTypeRecord[]> {
  const collected: LeaveTypeRecord[] = [];
  const seen = new Set<string>();
  let page = 1;
  let lastPage = 1;
  let total = 0;

  do {
    const result = await fetchLeaveTypes(accessToken, lang, tokenType, { page });
    lastPage = Math.max(1, result.meta.last_page);
    total = Math.max(total, result.meta.total);

    for (const leaveType of result.leaveTypes) {
      if (seen.has(leaveType.id)) {
        continue;
      }

      seen.add(leaveType.id);
      collected.push(leaveType);
    }

    page += 1;
  } while (
    page <= MAX_LEAVE_TYPE_PAGES &&
    (page <= lastPage || collected.length < total)
  );

  return collected;
}

export async function createLeaveTypeRequest(
  accessToken: string,
  lang: string,
  body: LeaveTypePayload,
  tokenType = "Bearer",
): Promise<LeaveTypeMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: leaveTypesCollectionUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage: "Failed to create leave type.",
  });

  if (!response.ok) {
    throw new LeaveTypesApiError(
      api.parseApiMessage(payload, "Failed to create leave type."),
    );
  }

  const { message, data } = api.assertSuccessResponse<LeaveTypeApiRecord>(
    payload,
    "Failed to create leave type.",
  );

  return {
    message,
    leaveType: mapLeaveTypeFromApi(data, lang),
  };
}

export async function updateLeaveTypeRequest(
  accessToken: string,
  lang: string,
  leaveTypeId: string,
  body: LeaveTypePayload,
  tokenType = "Bearer",
): Promise<LeaveTypeMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: leaveTypeItemUrl(leaveTypeId),
    accessToken,
    lang,
    tokenType,
    method: "PUT",
    body,
    fallbackMessage: "Failed to update leave type.",
  });

  if (!response.ok) {
    throw new LeaveTypesApiError(
      api.parseApiMessage(payload, "Failed to update leave type."),
    );
  }

  const { message, data } = api.assertSuccessResponse<LeaveTypeApiRecord>(
    payload,
    "Failed to update leave type.",
  );

  return {
    message,
    leaveType: mapLeaveTypeFromApi(data, lang),
  };
}

export async function deleteLeaveTypeRequest(
  accessToken: string,
  lang: string,
  leaveTypeId: string,
  tokenType = "Bearer",
): Promise<LeaveTypeDeleteResult> {
  const { response, payload } = await api.authorizedFetch({
    url: leaveTypeItemUrl(leaveTypeId),
    accessToken,
    lang,
    tokenType,
    method: "DELETE",
    fallbackMessage: "Failed to delete leave type.",
  });

  if (!response.ok) {
    throw new LeaveTypesApiError(
      api.parseApiMessage(payload, "Failed to delete leave type."),
    );
  }

  api.assertDeleteSuccess(payload, "Failed to delete leave type.");

  return {
    message: api.parseDeleteMessage(
      payload,
      "Failed to delete leave type.",
      "Leave type deleted successfully.",
    ),
  };
}
