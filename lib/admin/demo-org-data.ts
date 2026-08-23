import type { BranchOption, DepartmentOption } from "@/lib/auth/register-options";
import { BRANCH_OPTIONS } from "@/lib/auth/register-options";
import type {
  AdminBranchDepartmentRecord,
  AdminBranchRecord,
  AdminEmployee,
} from "@/types/AdminApiTypes";

export function isKnownBranchOption(value: string): value is BranchOption {
  return (BRANCH_OPTIONS as readonly string[]).includes(value);
}

export function slugifyBranchName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildUniqueBranchSlug(
  name: string,
  existing: readonly AdminBranchRecord[]
): string {
  const base = slugifyBranchName(name) || "branch";
  const existingSlugs = new Set(existing.map((item) => item.slug));
  if (!existingSlugs.has(base)) return base;

  let index = 2;
  while (existingSlugs.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

export const DEPARTMENT_SEED_NAMES: Record<DepartmentOption, string> = {
  hr: "Human Resources",
  operations: "Operations",
  finance: "Finance",
  it: "Information Technology",
  sales: "Sales",
};

export function slugifyDepartmentName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildUniqueDepartmentSlug(
  name: string,
  branchId: string,
  existing: readonly AdminBranchDepartmentRecord[]
): string {
  const base = slugifyDepartmentName(name) || "department";
  const existingSlugs = new Set(
    existing
      .filter((item) => item.branchId === branchId)
      .map((item) => item.slug)
  );
  if (!existingSlugs.has(base)) return base;

  let index = 2;
  while (existingSlugs.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

export function seedBranchDepartmentsFromEmployees(
  employees: readonly AdminEmployee[],
  branches: readonly AdminBranchRecord[]
): AdminBranchDepartmentRecord[] {
  const seen = new Set<string>();
  const records: AdminBranchDepartmentRecord[] = [];

  for (const employee of employees) {
    const branch = branches.find((item) => item.slug === employee.branch);
    if (!branch) continue;

    const key = `${branch.id}:${employee.department}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const branchEmployees = employees.filter(
      (item) =>
        item.branch === employee.branch && item.department === employee.department
    );
    const managerEmployee =
      branchEmployees.find((item) => item.status === "active") ?? branchEmployees[0];
    if (!managerEmployee) continue;

    records.push({
      id: `bd-${records.length + 1}`,
      branchId: branch.id,
      name: DEPARTMENT_SEED_NAMES[employee.department],
      slug: employee.department,
      managerEmployeeId: managerEmployee.id,
      createdAt: "2024-01-01",
    });
  }

  return records;
}
