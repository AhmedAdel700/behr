import { getEmployeesSnapshot } from "@/lib/admin/adminDataStore";
import {
  buildUniqueBranchSlug,
  buildUniqueDepartmentSlug,
} from "@/lib/admin/demo-org-data";
import type {
  AdminBranchDepartmentRecord,
  AdminBranchRecord,
} from "@/types/AdminApiTypes";

export interface CreateBranchInput {
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
}

export type UpdateBranchInput = CreateBranchInput;

export type DeleteBranchFailureReason = "not_found";

export type DeleteBranchResult =
  | { success: true }
  | { success: false; reason: DeleteBranchFailureReason };

export interface CreateBranchDepartmentInput {
  branchId: string;
  name: string;
  managerEmployeeId: string;
}

export type UpdateBranchDepartmentInput = CreateBranchDepartmentInput;

export type DeleteDepartmentFailureReason = "not_found";

export type DeleteDepartmentResult =
  | { success: true }
  | { success: false; reason: DeleteDepartmentFailureReason };

let branches: AdminBranchRecord[] = [];
let branchDepartments: AdminBranchDepartmentRecord[] = [];

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeOrg(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBranchesSnapshot(): AdminBranchRecord[] {
  return branches;
}

export function getBranchDepartmentsSnapshot(): AdminBranchDepartmentRecord[] {
  return branchDepartments;
}

export function getBranchBySlug(slug: string): AdminBranchRecord | undefined {
  return branches.find((branch) => branch.slug === slug);
}

export function getBranchById(id: string): AdminBranchRecord | undefined {
  return branches.find((branch) => branch.id === id);
}

export function setBranches(nextBranches: AdminBranchRecord[]): void {
  branches = nextBranches.map((item) => ({ ...item }));
  emit();
}

export function upsertBranchRecord(branch: AdminBranchRecord): void {
  const index = branches.findIndex((item) => item.id === branch.id);
  if (index < 0) {
    branches = [...branches, branch];
  } else {
    branches = [
      ...branches.slice(0, index),
      branch,
      ...branches.slice(index + 1),
    ];
  }
  emit();
}

export function removeBranchRecord(id: string): DeleteBranchResult {
  return deleteBranch(id);
}

export function getBranchDepartmentById(
  id: string
): AdminBranchDepartmentRecord | undefined {
  return branchDepartments.find((item) => item.id === id);
}

export function isRegisteredBranchSlug(slug: string): boolean {
  return branches.some((branch) => branch.slug === slug);
}

export function getBranchDepartmentsForBranch(
  branchId: string
): AdminBranchDepartmentRecord[] {
  return branchDepartments.filter((item) => item.branchId === branchId);
}

export function createBranch(input: CreateBranchInput): AdminBranchRecord {
  const slug = buildUniqueBranchSlug(input.name, branches);
  const next: AdminBranchRecord = {
    id: `branch-${Date.now()}`,
    slug,
    name: input.name.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  branches = [...branches, next];
  emit();
  return next;
}

export function updateBranch(
  id: string,
  input: UpdateBranchInput
): AdminBranchRecord | undefined {
  const index = branches.findIndex((branch) => branch.id === id);
  if (index < 0) return undefined;

  const current = branches[index];
  if (!current) return undefined;

  const next: AdminBranchRecord = {
    ...current,
    name: input.name.trim(),
    city: input.city.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
  };

  branches = [
    ...branches.slice(0, index),
    next,
    ...branches.slice(index + 1),
  ];
  emit();
  return next;
}

export function deleteBranch(id: string): DeleteBranchResult {
  const branch = getBranchById(id);
  if (!branch) {
    return { success: false, reason: "not_found" };
  }

  branchDepartments = branchDepartments.filter((item) => item.branchId !== id);
  branches = branches.filter((item) => item.id !== id);
  emit();
  return { success: true };
}

export function createBranchDepartment(
  input: CreateBranchDepartmentInput
): AdminBranchDepartmentRecord | undefined {
  const branch = getBranchById(input.branchId);
  if (!branch) return undefined;

  const trimmedName = input.name.trim();
  const duplicate = branchDepartments.some(
    (item) =>
      item.branchId === input.branchId &&
      item.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) return undefined;

  const managerExists = getEmployeesSnapshot().some(
    (employee) => employee.id === input.managerEmployeeId
  );
  if (!managerExists) return undefined;

  const next: AdminBranchDepartmentRecord = {
    id: `bd-${Date.now()}`,
    branchId: input.branchId,
    name: trimmedName,
    slug: buildUniqueDepartmentSlug(trimmedName, input.branchId, branchDepartments),
    managerEmployeeId: input.managerEmployeeId,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  branchDepartments = [...branchDepartments, next];
  emit();
  return next;
}

export function updateBranchDepartment(
  id: string,
  input: UpdateBranchDepartmentInput
): AdminBranchDepartmentRecord | undefined {
  const index = branchDepartments.findIndex((item) => item.id === id);
  if (index < 0) return undefined;

  const current = branchDepartments[index];
  if (!current) return undefined;

  const branch = getBranchById(input.branchId);
  if (!branch) return undefined;

  const trimmedName = input.name.trim();
  const duplicate = branchDepartments.some(
    (item) =>
      item.id !== id &&
      item.branchId === input.branchId &&
      item.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) return undefined;

  const managerExists = getEmployeesSnapshot().some(
    (employee) => employee.id === input.managerEmployeeId
  );
  if (!managerExists) return undefined;

  const next: AdminBranchDepartmentRecord = {
    ...current,
    branchId: input.branchId,
    name: trimmedName,
    slug: current.slug,
    managerEmployeeId: input.managerEmployeeId,
  };

  branchDepartments = [
    ...branchDepartments.slice(0, index),
    next,
    ...branchDepartments.slice(index + 1),
  ];
  emit();
  return next;
}

export function deleteBranchDepartment(id: string): DeleteDepartmentResult {
  const department = getBranchDepartmentById(id);
  if (!department) {
    return { success: false, reason: "not_found" };
  }

  branchDepartments = branchDepartments.filter((item) => item.id !== id);
  emit();
  return { success: true };
}

export function getBranchDepartmentAssignment(
  branchSlug: string,
  departmentSlug: string
): AdminBranchDepartmentRecord | undefined {
  const branch = getBranchBySlug(branchSlug);
  if (!branch) return undefined;

  return branchDepartments.find(
    (item) => item.branchId === branch.id && item.slug === departmentSlug
  );
}
