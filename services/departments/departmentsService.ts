import { parseLocalizedField } from "@/lib/admin/branchLocalizedText";
import {
  departmentItemUrl,
  departmentsCollectionUrl,
} from "@services/departments/departmentsPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
import { parseApiCount } from "@services/http/parseApiValues";
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

function mapDepartmentFromApi(
  record: DepartmentApiRecord,
  lang: string,
): DepartmentRecord {
  const name = parseLocalizedField(record.name, lang);

  return {
    id: String(record.id),
    name: name.display,
    nameLocalized: name.localized,
    branchId: record.branch ? String(record.branch.id) : "",
    branchName: parseLocalizedField(record.branch?.name, lang).display,
    branchCity: parseLocalizedField(record.branch?.city, lang).display,
    managerUserId: record.manager ? String(record.manager.id) : "",
    managerName: normalizeText(record.manager?.full_name),
    managerEmail: normalizeText(record.manager?.email),
    usersCount: parseApiCount(record.users_count),
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
    departments: data.map((record) => mapDepartmentFromApi(record, lang)),
    meta: api.parsePaginationMeta(payload),
  };
}

const MAX_DEPARTMENT_PAGES = 50;

export async function fetchAllDepartments(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: Pick<DepartmentsListQueryParams, "branch_id">,
): Promise<DepartmentRecord[]> {
  const collected: DepartmentRecord[] = [];
  const seen = new Set<string>();
  let page = 1;
  let lastPage = 1;

  do {
    const result = await fetchDepartments(accessToken, lang, tokenType, {
      page,
      ...(params?.branch_id ? { branch_id: params.branch_id } : {}),
    });
    lastPage = Math.max(1, result.meta.last_page);

    for (const department of result.departments) {
      if (seen.has(department.id)) {
        continue;
      }

      seen.add(department.id);
      collected.push(department);
    }

    page += 1;
  } while (page <= lastPage && page <= MAX_DEPARTMENT_PAGES);

  return collected;
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

  return mapDepartmentFromApi(data, lang);
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
    department: mapDepartmentFromApi(data, lang),
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
    department: mapDepartmentFromApi(data, lang),
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
