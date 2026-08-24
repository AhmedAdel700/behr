import { buildJsonHeaders } from "@services/auth/shared";
import {
  departmentItemUrl,
  departmentsCollectionUrl,
} from "@services/departments/departmentsPaths";
import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
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

function parseCount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
    throw new DepartmentsApiError(fallbackMessage);
  }

  const response = payload as { success: boolean; message: string; data: T | null };

  if (!response.success || response.data === null) {
    throw new DepartmentsApiError(response.message || fallbackMessage);
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
  if (error instanceof DepartmentsApiError) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new DepartmentsApiError(
      "Could not reach the departments server. Check CORS/SSL or network.",
    );
  }

  if (error instanceof Error && error.message.includes("fetch failed")) {
    throw new DepartmentsApiError(
      "Could not reach the departments server. Check SSL certificate or network.",
    );
  }

  throw new DepartmentsApiError(fallback);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
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

function buildDepartmentsListUrl(params?: DepartmentsListQueryParams): string {
  const searchParams = new URLSearchParams();
  const search = params?.search?.trim();

  if (search) {
    searchParams.set("search", search);
  }

  if (params?.branch_id?.trim()) {
    searchParams.set("branch_id", params.branch_id.trim());
  }

  if (params?.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query ? `${departmentsCollectionUrl()}?${query}` : departmentsCollectionUrl();
}

export async function fetchDepartments(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: DepartmentsListQueryParams,
): Promise<DepartmentsListResult> {
  let response: Response;

  try {
    response = await fetch(buildDepartmentsListUrl(params), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load departments.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new DepartmentsApiError(
      parseApiMessage(payload, "Failed to load departments."),
    );
  }

  const { data } = assertSuccessResponse<DepartmentApiRecord[]>(
    payload,
    "Failed to load departments.",
  );

  if (!Array.isArray(data)) {
    throw new DepartmentsApiError("Unexpected departments response.");
  }

  return {
    departments: data.map(mapDepartmentFromApi),
    meta: parsePaginationMeta(payload),
  };
}

export async function fetchDepartmentById(
  accessToken: string,
  lang: string,
  departmentId: string,
  tokenType = "Bearer",
): Promise<DepartmentRecord> {
  let response: Response;

  try {
    response = await fetch(departmentItemUrl(departmentId), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load department.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new DepartmentsApiError(
      parseApiMessage(payload, "Failed to load department."),
    );
  }

  const { data } = assertSuccessResponse<DepartmentApiRecord>(
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
  let response: Response;

  try {
    response = await fetch(departmentsCollectionUrl(), {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to create department.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new DepartmentsApiError(
      parseApiMessage(payload, "Failed to create department."),
    );
  }

  const { message, data } = assertSuccessResponse<DepartmentApiRecord>(
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
  let response: Response;

  try {
    response = await fetch(departmentItemUrl(departmentId), {
      method: "PUT",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to update department.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new DepartmentsApiError(
      parseApiMessage(payload, "Failed to update department."),
    );
  }

  const { message, data } = assertSuccessResponse<DepartmentApiRecord>(
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
  let response: Response;

  try {
    response = await fetch(departmentItemUrl(departmentId), {
      method: "DELETE",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to delete department.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new DepartmentsApiError(
      parseApiMessage(payload, "Failed to delete department."),
    );
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === false
  ) {
    throw new DepartmentsApiError(
      parseApiMessage(payload, "Failed to delete department."),
    );
  }

  return {
    message: parseApiMessage(payload, "Department deleted successfully."),
  };
}
