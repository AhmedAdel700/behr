import type {
  EmployeeApiBranch,
  EmployeeApiDepartment,
  EmployeeApiJobPosition,
} from "@/types/EmployeesApiTypes";
import type { EmployeeProfile } from "@/types/EmployeeProfileTypes";

export interface ProfileApiRecord {
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
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface ProfileResult extends EmployeeProfile {
  roles: string[];
  permissions: string[];
  jobPositionId: string | null;
  branchId: string | null;
  departmentId: string | null;
  lineManagerId: string | null;
}

export interface ProfileUpdatePayload {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  image?: File;
}

export interface ProfileUpdateResult {
  message: string;
  profile: ProfileResult;
}

export class ProfileApiError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ProfileApiError";
    this.fieldErrors = fieldErrors;
  }
}
