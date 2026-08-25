import {
  departmentItemUrl,
  departmentsCollectionUrl,
} from "@services/departments/departmentsPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
import type {
  DepartmentApiRecord,
  DepartmentDeleteResult,
  DepartmentMutationResult,
  DepartmentPayload,
  DepartmentRecord,
  DepartmentsListQueryParams,
  DepartmentsListResult,
} from "@/types/DepartmentsApiTypes";
import { DepartmentsApiError } from "@/types/DepartmentsApiTypes";

const api = createApiHttp(DepartmentsApiError, "departments server");

function normalizeText(value: string | null | undefined): string {
  return value ?? "";
}

function parseCount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapDepartmentFromApi(record: DepartmentApiRecord): DepartmentRecord {
  return {
    id: String(record.id),
    name: normalizeText(record.name),
    branchId: record.branch ? String(record.branch.id) : "",
    branchName: normalizeText(record.branch?.name),
    branchCity: normalizeText(record.branch?.city),
    managerUserId: record.manager ? String(record.manager.id) : "",
    managerName: normalizeText(record.manager?.full_name),
    managerEmail: normalizeText(record.manager?.email),
    usersCount:
      parseCount(record.users_count) + (record.manager ? 1 : 0),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export async function fetchDepartments(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: DepartmentsListQueryParams,
): Promise<DepartmentsListResult> {
  const { response, payload } = await api.authorizedFetch({
    url: appendListQueryParams(departmentsCollectionUrl(), params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load departments.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load departments.");
  }

  const { data } = api.assertSuccessResponse<DepartmentApiRecord[]>(
    payload,
    "Failed to load departments.",
  );

  if (!Array.isArray(data)) {
    throw new DepartmentsApiError("Unexpected departments response.");
  }

  return {
    departments: data.map(mapDepartmentFromApi),
    meta: api.parsePaginationMeta(payload),
  };
}

export async function fetchDepartmentById(
  accessToken: string,
  lang: string,
  departmentId: string,
  tokenType = "Bearer",
): Promise<DepartmentRecord> {
  const { response, payload } = await api.authorizedFetch({
    url: departmentItemUrl(departmentId),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load department.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to load department.");
  }

  const { data } = api.assertSuccessResponse<DepartmentApiRecord>(
    payload,
    "Failed to load department.",
  );

  return mapDepartmentFromApi(data);
}

export async function createDepartmentRequest(
  accessToken: string,
  lang: string,
  body: DepartmentPayload,
  tokenType = "Bearer",
): Promise<DepartmentMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: departmentsCollectionUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body,
    fallbackMessage: "Failed to create department.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to create department.");
  }

  const { message, data } = api.assertSuccessResponse<DepartmentApiRecord>(
    payload,
    "Failed to create department.",
  );

  return {
    message,
    department: mapDepartmentFromApi(data),
  };
}

export async function updateDepartmentRequest(
  accessToken: string,
  lang: string,
  departmentId: string,
  body: DepartmentPayload,
  tokenType = "Bearer",
): Promise<DepartmentMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: departmentItemUrl(departmentId),
    accessToken,
    lang,
    tokenType,
    method: "PUT",
    body,
    fallbackMessage: "Failed to update department.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to update department.");
  }

  const { message, data } = api.assertSuccessResponse<DepartmentApiRecord>(
    payload,
    "Failed to update department.",
  );

  return {
    message,
    department: mapDepartmentFromApi(data),
  };
}

export async function deleteDepartmentRequest(
  accessToken: string,
  lang: string,
  departmentId: string,
  tokenType = "Bearer",
): Promise<DepartmentDeleteResult> {
  const { response, payload } = await api.authorizedFetch({
    url: departmentItemUrl(departmentId),
    accessToken,
    lang,
    tokenType,
    method: "DELETE",
    fallbackMessage: "Failed to delete department.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to delete department.");
  }

  api.assertDeleteSuccess(payload, "Failed to delete department.");

  return {
    message: api.parseDeleteMessage(
      payload,
      "Failed to delete department.",
      "Department deleted successfully.",
    ),
  };
}
