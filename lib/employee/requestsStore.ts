import {
  DEMO_EMPLOYEE_ID,
  demoRequests,
  type DemoRequest,
  type RequestStatus,
} from "@/lib/employee/demo-data";
import type { RequestFormValues } from "@/schemas/employee/request.schema";

let requests: DemoRequest[] = demoRequests.map((item) => ({ ...item }));
const listeners = new Set<() => void>();

let employeeRequestsSnapshot: DemoRequest[] = [];

function refreshEmployeeRequestsSnapshot(
  employeeId: string = DEMO_EMPLOYEE_ID
): void {
  employeeRequestsSnapshot = requests.filter(
    (item) => item.employeeId === employeeId
  );
}

refreshEmployeeRequestsSnapshot();

function emit(): void {
  refreshEmployeeRequestsSnapshot();
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeRequests(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRequestsSnapshot(): DemoRequest[] {
  return requests;
}

export function getEmployeeRequestsSnapshot(
  employeeId: string = DEMO_EMPLOYEE_ID
): DemoRequest[] {
  if (employeeId !== DEMO_EMPLOYEE_ID) {
    return requests.filter((item) => item.employeeId === employeeId);
  }
  return employeeRequestsSnapshot;
}

export function getRequestById(id: string): DemoRequest | undefined {
  return requests.find((item) => item.id === id);
}

export function getEmployeeRequestById(
  id: string,
  employeeId: string = DEMO_EMPLOYEE_ID
): DemoRequest | undefined {
  const item = getRequestById(id);
  if (!item || item.employeeId !== employeeId) return undefined;
  return item;
}

export function canModifyRequest(status: RequestStatus): boolean {
  return status === "pending";
}

export function updateRequest(
  id: string,
  values: RequestFormValues
): DemoRequest | undefined {
  const index = requests.findIndex((item) => item.id === id);
  if (index < 0) return undefined;

  const current = requests[index];
  if (!current || !canModifyRequest(current.status)) return undefined;

  const next: DemoRequest = {
    ...current,
    status: current.status,
    from: values.from,
    to: values.to ?? values.from,
    reason: values.reason,
    note: current.note,
    startTime: values.startTime?.trim() ? values.startTime : undefined,
    endTime: values.endTime?.trim() ? values.endTime : undefined,
  };

  requests = [
    ...requests.slice(0, index),
    next,
    ...requests.slice(index + 1),
  ];
  emit();
  return next;
}

export function deleteRequest(id: string): boolean {
  const current = getRequestById(id);
  if (!current || !canModifyRequest(current.status)) return false;

  const next = requests.filter((item) => item.id !== id);
  if (next.length === requests.length) return false;

  requests = next;
  emit();
  return true;
}

export function setRequestStatus(
  id: string,
  status: Exclude<RequestStatus, "pending">
): DemoRequest | undefined {
  const index = requests.findIndex((item) => item.id === id);
  if (index < 0) return undefined;

  const current = requests[index];
  if (!current || !canModifyRequest(current.status)) return undefined;

  const next: DemoRequest = {
    ...current,
    status,
  };

  requests = [
    ...requests.slice(0, index),
    next,
    ...requests.slice(index + 1),
  ];
  emit();
  return next;
}
