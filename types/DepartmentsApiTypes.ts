import type {
  BranchesPaginationMeta,
  LocalizedApiValue,
  LocalizedTextPayload,
} from "@/types/BranchesApiTypes";

export type { LocalizedApiValue, LocalizedTextPayload };

export interface DepartmentApiBranch {
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

export interface DepartmentApiManager {
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

export interface DepartmentApiRecord {
  id: number;
  name: LocalizedApiValue;
  branch: DepartmentApiBranch | null;
  manager: DepartmentApiManager | null;
  users_count: string;
  created_at: string;
  updated_at: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  nameLocalized: LocalizedTextPayload;
  branchId: string;
  branchName: string;
  branchCity: string;
  managerUserId: string;
  managerName: string;
  managerEmail: string;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentsListQueryParams {
  search?: string;
  branch_id?: string;
  page?: number;
}

export interface DepartmentsListResult {
  departments: DepartmentRecord[];
  meta: BranchesPaginationMeta;
}

export interface DepartmentPayload {
  name: LocalizedTextPayload;
  branch_id: number;
  manager_user_id?: number | null;
}

export interface DepartmentMutationResult {
  department: DepartmentRecord;
  message: string;
}

export interface DepartmentDeleteResult {
  message: string;
}

export class DepartmentsApiError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "DepartmentsApiError";
    this.fieldErrors = fieldErrors;
  }
}
