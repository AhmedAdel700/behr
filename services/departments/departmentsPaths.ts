import { getApiBaseUrl } from "@services/auth/shared";
import { DepartmentsApiError } from "@/types/DepartmentsApiTypes";

export function departmentsCollectionUrl(): string {
  return `${getApiBaseUrl()}/departments`;
}

export function departmentItemUrl(departmentId: string): string {
  const normalizedDepartmentId = departmentId.trim();

  if (!normalizedDepartmentId) {
    throw new DepartmentsApiError("Department id is required.");
  }

  return `${departmentsCollectionUrl()}/${encodeURIComponent(normalizedDepartmentId)}`;
}
