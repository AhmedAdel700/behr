import type { BranchOption, DepartmentOption } from "@/lib/auth/register-options";

export type AdminRole = "super_admin" | "department_manager";

export type RegistrationRequestStatus = "pending" | "approved" | "rejected";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  department?: DepartmentOption;
}

export interface AdminEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  fingerprintNumber: string;
  branch: BranchOption;
  department: DepartmentOption;
  position: string;
  joinedAt: string;
  status: "active" | "inactive";
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  fingerprintNumber: string;
  branch: BranchOption;
  department: DepartmentOption;
  position: string;
  status: RegistrationRequestStatus;
  submittedAt: string;
}

export interface AdminDepartmentManager {
  name: string;
  email: string;
  position: string;
}

export interface AdminBranchRecord {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface AdminBranchDepartmentRecord {
  id: string;
  branchId: string;
  name: string;
  slug: string;
  managerEmployeeId: string;
  createdAt: string;
}

export interface AdminDepartmentOverview {
  department: DepartmentOption;
  manager: AdminDepartmentManager;
  members: AdminEmployee[];
}

export interface AdminBranchDepartmentSummary {
  id: string;
  slug: string;
  name: string;
  manager: AdminDepartmentManager;
  memberCount: number;
}

export interface AdminBranchOverview {
  branch: string;
  employeeCount: number;
  departments: AdminBranchDepartmentSummary[];
}

export interface AdminBranchDepartmentOverview {
  branch: string;
  slug: string;
  name: string;
  manager: AdminDepartmentManager;
  members: AdminEmployee[];
}
