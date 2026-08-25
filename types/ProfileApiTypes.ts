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
  phone: string;
  fingerprint_number: string;
  branch_id: number;
  department_id: number;
  job_position_id: number;
  role: string;
}

export class ProfileApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileApiError";
  }
}
