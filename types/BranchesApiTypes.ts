import type { AdminBranchRecord } from "@/types/AdminApiTypes";

export interface BranchApiRecord {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number | null;
  departments_count: string;
  users_count: string;
  created_at: string;
  updated_at: string;
}

export interface BranchesPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface BranchesListQueryParams {
  search?: string;
  page?: number;
}

export interface BranchPayload {
  name: string;
  city: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface BranchApiResponse {
  success: boolean;
  message: string;
  data: BranchApiRecord | null;
}

export interface BranchesListApiResponse {
  success: boolean;
  message: string;
  data: BranchApiRecord[] | null;
  meta: BranchesPaginationMeta;
}

export interface BranchesListResult {
  branches: AdminBranchRecord[];
  meta: BranchesPaginationMeta;
}

export interface BranchMutationResult {
  branch: AdminBranchRecord;
  message: string;
}

export interface BranchDeleteResult {
  message: string;
}

export class BranchesApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BranchesApiError";
  }
}
