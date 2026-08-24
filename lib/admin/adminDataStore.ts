import {
  MOCK_ADMIN_EMPLOYEES,
  MOCK_REGISTRATION_REQUESTS,
} from "@/lib/admin/demo-data";
import type {
  AdminEmployee,
  RegistrationRequest,
  RegistrationRequestStatus,
} from "@/types/AdminApiTypes";

let employees: AdminEmployee[] = MOCK_ADMIN_EMPLOYEES.map((item) => ({ ...item }));
let registrations: RegistrationRequest[] = MOCK_REGISTRATION_REQUESTS.map(
  (item) => ({ ...item })
);

const employeeListeners = new Set<() => void>();
const registrationListeners = new Set<() => void>();

function emitEmployee(): void {
  for (const listener of employeeListeners) {
    listener();
  }
}

function emitRegistration(): void {
  for (const listener of registrationListeners) {
    listener();
  }
}

export function subscribeEmployees(listener: () => void): () => void {
  employeeListeners.add(listener);
  return () => {
    employeeListeners.delete(listener);
  };
}

export function subscribeRegistrations(listener: () => void): () => void {
  registrationListeners.add(listener);
  return () => {
    registrationListeners.delete(listener);
  };
}

export function getEmployeesSnapshot(): AdminEmployee[] {
  return employees;
}

export function getEmployeeById(id: string): AdminEmployee | undefined {
  return employees.find((item) => item.id === id);
}

export function getRegistrationsSnapshot(): RegistrationRequest[] {
  return registrations;
}

export function deleteEmployee(id: string): boolean {
  const next = employees.filter((item) => item.id !== id);
  if (next.length === employees.length) return false;
  employees = next;
  emitEmployee();
  return true;
}

export function updateEmployee(
  id: string,
  patch: Partial<
    Pick<AdminEmployee, "branch" | "department" | "position" | "fingerprintNumber">
  >
): AdminEmployee | undefined {
  const index = employees.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  const current = employees[index];
  if (!current) return undefined;
  const next: AdminEmployee = { ...current, ...patch };
  employees = [
    ...employees.slice(0, index),
    next,
    ...employees.slice(index + 1),
  ];
  emitEmployee();
  return next;
}

export function setRegistrationStatus(
  id: string,
  status: RegistrationRequestStatus
): RegistrationRequest | undefined {
  const index = registrations.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  const current = registrations[index];
  if (!current || current.status !== "pending") return undefined;
  const next: RegistrationRequest = { ...current, status };
  registrations = [
    ...registrations.slice(0, index),
    next,
    ...registrations.slice(index + 1),
  ];
  emitRegistration();
  return next;
}
