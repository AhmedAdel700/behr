import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";

export interface EmployeeApiBranch {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeApiManager {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  fingerprint_number: string | null;
  image: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeApiDepartment {
  id: number;
  name: string;
  manager: EmployeeApiManager | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeApiJobPosition {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeApiRecord {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  fingerprint_number: string | null;
  image: string | null;
  email_verified_at: string | null;
  branch: EmployeeApiBranch | null;
  department: EmployeeApiDepartment | null;
  job_position: EmployeeApiJobPosition | null;
  roles?: string[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeBranchSummary {
  id: string;
  name: string;
  city: string;
}

export interface EmployeeManagerSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface EmployeeDepartmentSummary {
  id: string;
  name: string;
  manager: EmployeeManagerSummary | null;
}

export interface EmployeeJobPositionSummary {
  id: string;
  name: string;
}

export interface EmployeeRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  fingerprintNumber: string;
  image: string | null;
  branch: EmployeeBranchSummary | null;
  department: EmployeeDepartmentSummary | null;
  jobPosition: EmployeeJobPositionSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeManagerRecord {
  id: string;
  name: string;
  email: string;
  position: string;
  branchId: string | null;
}

export interface EmployeesListQueryParams {
  search?: string;
  page?: number;
  branch_id?: string;
  department_id?: string;
}

export interface EmployeesListResult {
  employees: EmployeeRecord[];
  meta: BranchesPaginationMeta;
}

export interface EmployeePayload {
  name: string;
  email: string;
  phone: string;
  branch_id: number;
  department_id: number;
  job_position_id: number;
  fingerprint_number: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  phone: string;
  fingerprint_number: string;
  password: string;
  password_confirmation: string;
  branch_id: number;
  department_id: number;
  job_position_id: number;
  role: "employee";
  image?: File;
}

export interface EmployeeMutationResult {
  employee: EmployeeRecord;
  message: string;
}

export interface EmployeeDeleteResult {
  message: string;
}

export class EmployeesApiError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "EmployeesApiError";
    this.fieldErrors = fieldErrors;
  }
}
