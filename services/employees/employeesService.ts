import {
  employeesCollectionUrl,
} from "@services/employees/employeesPaths";
import { userItemUrl } from "@services/users/usersPaths";
import { createApiHttp } from "@services/http/apiHttp";
import { appendListQueryParams } from "@services/http/listQuery";
import type {
  EmployeeApiRecord,
  EmployeeBranchSummary,
  CreateEmployeePayload,
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
import { resolveAvatarSrc } from "@/lib/employee/avatar";
import { EmployeesApiError } from "@/types/EmployeesApiTypes";

const api = createApiHttp(EmployeesApiError, "employees server");

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
    image: resolveAvatarSrc(
      typeof record.image === "string" ? record.image : null,
    ),
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
  const { response, payload } = await api.authorizedFetch({
    url: appendListQueryParams(employeesCollectionUrl(), params),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load employees.",
  });

  if (!response.ok) {
    throw new EmployeesApiError(
      api.parseApiMessage(payload, "Failed to load employees."),
    );
  }

  const { data } = api.assertSuccessResponse<unknown>(
    payload,
    "Failed to load employees.",
  );

  if (!Array.isArray(data)) {
    throw new EmployeesApiError("Unexpected employees response.");
  }

  return {
    employees: data.filter(isEmployeeApiRecord).map(mapEmployeeFromApi),
    meta: api.parsePaginationMeta(payload),
  };
}

export async function fetchEmployee(
  accessToken: string,
  lang: string,
  employeeId: string,
  tokenType = "Bearer",
): Promise<EmployeeRecord> {
  const { response, payload } = await api.authorizedFetch({
    url: userItemUrl(employeeId),
    accessToken,
    lang,
    tokenType,
    fallbackMessage: "Failed to load employee.",
  });

  if (!response.ok) {
    throw new EmployeesApiError(
      api.parseApiMessage(payload, "Failed to load employee."),
    );
  }

  const { data } = api.assertSuccessResponse<EmployeeApiRecord>(
    payload,
    "Failed to load employee.",
  );

  if (!isEmployeeApiRecord(data)) {
    throw new EmployeesApiError("Unexpected employee response.");
  }

  return mapEmployeeFromApi(data);
}

function toCreateEmployeeFormData(body: CreateEmployeePayload): FormData {
  const formData = new FormData();
  formData.append("name", body.name);
  formData.append("email", body.email);
  formData.append("phone", body.phone);
  formData.append("fingerprint_number", body.fingerprint_number);
  formData.append("password", body.password);
  formData.append("password_confirmation", body.password_confirmation);
  formData.append("branch_id", String(body.branch_id));
  formData.append("department_id", String(body.department_id));
  formData.append("job_position_id", String(body.job_position_id));
  formData.append("role", body.role);

  if (body.image) {
    formData.append("image", body.image);
  }

  return formData;
}

export async function createEmployeeRequest(
  accessToken: string,
  lang: string,
  body: CreateEmployeePayload,
  tokenType = "Bearer",
): Promise<EmployeeMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: employeesCollectionUrl(),
    accessToken,
    lang,
    tokenType,
    method: "POST",
    body: toCreateEmployeeFormData(body),
    fallbackMessage: "Failed to create employee.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to create employee.");
  }

  const { message, data } = api.assertSuccessResponse<unknown>(
    payload,
    "Failed to create employee.",
  );

  if (!isEmployeeApiRecord(data)) {
    throw new EmployeesApiError("Unexpected employee response.");
  }

  return {
    message,
    employee: mapEmployeeFromApi(data),
  };
}

export async function updateEmployeeRequest(
  accessToken: string,
  lang: string,
  employeeId: string,
  body: EmployeePayload,
  tokenType = "Bearer",
): Promise<EmployeeMutationResult> {
  const { response, payload } = await api.authorizedFetch({
    url: userItemUrl(employeeId),
    accessToken,
    lang,
    tokenType,
    method: "PUT",
    body,
    fallbackMessage: "Failed to update employee.",
  });

  if (!response.ok) {
    api.throwFromPayload(payload, "Failed to update employee.");
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    payload.success === false
  ) {
    api.throwFromPayload(payload, "Failed to update employee.");
  }

  const message = api.parseApiMessage(payload, "Employee updated successfully.");
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
  const { response, payload } = await api.authorizedFetch({
    url: userItemUrl(employeeId),
    accessToken,
    lang,
    tokenType,
    method: "DELETE",
    fallbackMessage: "Failed to delete employee.",
  });

  if (!response.ok) {
    throw new EmployeesApiError(
      api.parseApiMessage(payload, "Failed to delete employee."),
    );
  }

  api.assertDeleteSuccess(payload, "Failed to delete employee.");

  return {
    message: api.parseDeleteMessage(
      payload,
      "Failed to delete employee.",
      "Employee deleted successfully.",
    ),
  };
}
