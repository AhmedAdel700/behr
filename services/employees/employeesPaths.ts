import { EmployeesApiError } from "@/types/EmployeesApiTypes";
import {
  userItemUrl,
  usersCollectionUrl,
} from "@services/users/usersPaths";

export function employeesCollectionUrl(): string {
  return usersCollectionUrl();
}

export function employeeItemUrl(employeeId: string): string {
  const normalizedEmployeeId = employeeId.trim();

  if (!normalizedEmployeeId) {
    throw new EmployeesApiError("Employee id is required.");
  }

  return userItemUrl(normalizedEmployeeId);
}
