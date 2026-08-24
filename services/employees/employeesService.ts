import { buildJsonHeaders } from "@services/auth/shared";
import {
  employeeItemUrl,
  employeesCollectionUrl,
} from "@services/employees/employeesPaths";
import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";
import type {
  EmployeeApiRecord,
  EmployeeBranchSummary,
  EmployeeDeleteResult,
  EmployeeDepartmentSummary,
  EmployeeJobPositionSummary,
  EmployeeManagerRecord,
  EmployeeManagerSummary,
  EmployeeMutationResult,
  EmployeePayload,
  EmployeeRecord,
  EmployeesListQueryParams,
  EmployeesListResult,
} from "@/types/EmployeesApiTypes";
import { EmployeesApiError } from "@/types/EmployeesApiTypes";

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
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
    throw new EmployeesApiError(fallbackMessage);
  }

  const response = payload as {
    success: boolean;
    message: string;
    data: T | null;
  };

  if (!response.success || response.data === null) {
    throw new EmployeesApiError(response.message || fallbackMessage);
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
  if (error instanceof EmployeesApiError) {
    throw error;
  }

  if (error instanceof TypeError) {
    throw new EmployeesApiError(
      "Could not reach the employees server. Check CORS/SSL or network.",
    );
  }

  if (error instanceof Error && error.message.includes("fetch failed")) {
    throw new EmployeesApiError(
      "Could not reach the employees server. Check SSL certificate or network.",
    );
  }

  throw new EmployeesApiError(fallback);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function mapBranch(value: unknown): EmployeeBranchSummary | null {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  if (!record || !id) {
    return null;
  }

  return {
    id,
    name: typeof record.name === "string" ? record.name : "",
    city: typeof record.city === "string" ? record.city : "",
  };
}

function mapManager(value: unknown): EmployeeManagerSummary | null {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  if (!record || !id) {
    return null;
  }

  return {
    id,
    fullName:
      typeof record.full_name === "string" ? record.full_name : "",
    email: typeof record.email === "string" ? record.email : "",
  };
}

function mapDepartment(value: unknown): EmployeeDepartmentSummary | null {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  if (!record || !id) {
    return null;
  }

  return {
    id,
    name: typeof record.name === "string" ? record.name : "",
    manager: mapManager(record.manager),
  };
}

function mapJobPosition(value: unknown): EmployeeJobPositionSummary | null {
  const record = asRecord(value);
  const id = record ? readId(record.id) : null;
  if (!record || !id) {
    return null;
  }

  return {
    id,
    name: typeof record.name === "string" ? record.name : "",
  };
}

function mapEmployeeFromApi(record: EmployeeApiRecord): EmployeeRecord {
  return {
    id: String(record.id),
    fullName: normalizeText(record.full_name),
    email: normalizeText(record.email),
    phone: normalizeText(record.phone),
    fingerprintNumber: normalizeText(record.fingerprint_number),
    image: record.image,
    branch: mapBranch(record.branch),
    department: mapDepartment(record.department),
    jobPosition: mapJobPosition(record.job_position),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function isEmployeeApiRecord(value: unknown): value is EmployeeApiRecord {
  const record = asRecord(value);
  return (
    record !== null &&
    readId(record.id) !== null &&
    typeof record.full_name === "string" &&
    typeof record.email === "string"
  );
}

function buildEmployeesListUrl(params?: EmployeesListQueryParams): string {
  const searchParams = new URLSearchParams();
  const search = params?.search?.trim();

  if (search) {
    searchParams.set("search", search);
  }

  if (params?.branch_id?.trim()) {
    searchParams.set("branch_id", params.branch_id.trim());
  }

  if (params?.department_id?.trim()) {
    searchParams.set("department_id", params.department_id.trim());
  }

  if (params?.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query
    ? `${employeesCollectionUrl()}?${query}`
    : employeesCollectionUrl();
}

export function toEmployeeManagerRecord(
  employee: EmployeeRecord,
): EmployeeManagerRecord {
  return {
    id: employee.id,
    name: employee.fullName,
    email: employee.email,
    position: employee.jobPosition?.name ?? "",
    branchId: employee.branch?.id ?? null,
  };
}

export async function fetchEmployees(
  accessToken: string,
  lang: string,
  tokenType = "Bearer",
  params?: EmployeesListQueryParams,
): Promise<EmployeesListResult> {
  let response: Response;

  try {
    response = await fetch(buildEmployeesListUrl(params), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load employees.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new EmployeesApiError(
      parseApiMessage(payload, "Failed to load employees."),
    );
  }

  const { data } = assertSuccessResponse<unknown>(
    payload,
    "Failed to load employees.",
  );

  if (!Array.isArray(data)) {
    throw new EmployeesApiError("Unexpected employees response.");
  }

  return {
    employees: data.filter(isEmployeeApiRecord).map(mapEmployeeFromApi),
    meta: parsePaginationMeta(payload),
  };
}

export async function fetchEmployee(
  accessToken: string,
  lang: string,
  employeeId: string,
  tokenType = "Bearer",
): Promise<EmployeeRecord> {
  let response: Response;

  try {
    response = await fetch(employeeItemUrl(employeeId), {
      method: "GET",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      cache: "no-store",
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to load employee.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new EmployeesApiError(
      parseApiMessage(payload, "Failed to load employee."),
    );
  }

  const { data } = assertSuccessResponse<unknown>(
    payload,
    "Failed to load employee.",
  );

  if (!isEmployeeApiRecord(data)) {
    throw new EmployeesApiError("Unexpected employee response.");
  }

  return mapEmployeeFromApi(data);
}

export async function updateEmployeeRequest(
  accessToken: string,
  lang: string,
  employeeId: string,
  body: EmployeePayload,
  tokenType = "Bearer",
): Promise<EmployeeMutationResult> {
  let response: Response;

  try {
    response = await fetch(employeeItemUrl(employeeId), {
      method: "PUT",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
      body: JSON.stringify(body),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to update employee.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new EmployeesApiError(
      parseApiMessage(payload, "Failed to update employee."),
    );
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === false
  ) {
    throw new EmployeesApiError(
      parseApiMessage(payload, "Failed to update employee."),
    );
  }

  const message = parseApiMessage(payload, "Employee updated successfully.");
  const data =
    typeof payload === "object" && payload !== null && "data" in payload
      ? payload.data
      : null;

  if (isEmployeeApiRecord(data)) {
    return {
      message,
      employee: mapEmployeeFromApi(data),
    };
  }

  return {
    message,
    employee: await fetchEmployee(accessToken, lang, employeeId, tokenType),
  };
}

export async function deleteEmployeeRequest(
  accessToken: string,
  lang: string,
  employeeId: string,
  tokenType = "Bearer",
): Promise<EmployeeDeleteResult> {
  let response: Response;

  try {
    response = await fetch(employeeItemUrl(employeeId), {
      method: "DELETE",
      headers: buildAuthorizedHeaders(accessToken, lang, tokenType),
    });
  } catch (error) {
    wrapNetworkError(error, "Failed to delete employee.");
  }

  const payload: unknown = await readJsonPayload(response);

  if (!response.ok) {
    throw new EmployeesApiError(
      parseApiMessage(payload, "Failed to delete employee."),
    );
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === false
  ) {
    throw new EmployeesApiError(
      parseApiMessage(payload, "Failed to delete employee."),
    );
  }

  return {
    message: parseApiMessage(payload, "Employee deleted successfully."),
  };
}
