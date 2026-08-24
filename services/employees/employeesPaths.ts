import { getApiBaseUrl } from "@services/auth/shared";
import { EmployeesApiError } from "@/types/EmployeesApiTypes";

export function employeesCollectionUrl(): string {
  return `${getApiBaseUrl()}/employees`;
}

export function employeeItemUrl(employeeId: string): string {
  const normalizedEmployeeId = employeeId.trim();

  if (!normalizedEmployeeId) {
    throw new EmployeesApiError("Employee id is required.");
  }

  return `${employeesCollectionUrl()}/${encodeURIComponent(normalizedEmployeeId)}`;
}
