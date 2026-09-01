import type {
  ApiPaginationMeta,
  LocalizedApiObject,
  LocalizedApiValue,
} from "@/types/ApiSharedTypes";

export type { LocalizedApiObject, LocalizedApiValue };

export type RegistrationRequestStatus = "pending" | "accepted" | "rejected";

export interface RegistrationRequestApiBranch {
  id: number;
  name: LocalizedApiValue;
  city: LocalizedApiValue | null;
  address: LocalizedApiValue | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationRequestApiDepartment {
  id: number;
  name: LocalizedApiValue;
}

export interface RegistrationRequestApiJobPosition {
  id: number;
  name: LocalizedApiValue;
  created_at: string;
  updated_at: string;
}

export interface RegistrationRequestApiReviewer {
  id: number;
  full_name: string;
}

export interface RegistrationRequestApiUser {
  id: number;
  full_name: string;
  email: string;
}

export interface RegistrationRequestApiRecord {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  fingerprint_number: string | null;
  image: string | null;
  status: string;
  rejection_reason: string | null;
  branch: RegistrationRequestApiBranch | null;
  department: RegistrationRequestApiDepartment | null;
  job_position: RegistrationRequestApiJobPosition | null;
  reviewer?: RegistrationRequestApiReviewer | null;
  user?: RegistrationRequestApiUser | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationRequestRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  fingerprintNumber: string;
  image: string | null;
  status: RegistrationRequestStatus;
  rejectionReason: string;
  branchName: string;
  departmentName: string;
  positionName: string;
  reviewerName: string;
  userName: string;
  userEmail: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationRequestsListQueryParams {
  search?: string;
  page?: number;
  status?: RegistrationRequestStatus;
}

export interface RegistrationRequestsListResult {
  requests: RegistrationRequestRecord[];
  meta: ApiPaginationMeta;
}

export interface RegistrationReviewResult {
  message: string;
  request: RegistrationRequestRecord | null;
}

export interface RejectRegistrationPayload {
  rejection_reason?: string | null;
}

export class RegistrationRequestsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationRequestsApiError";
  }
}
