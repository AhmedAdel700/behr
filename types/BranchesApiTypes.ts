import type { AdminBranchRecord } from "@/types/AdminApiTypes";

export interface LocalizedTextPayload {
  en: string;
  ar: string;
}

export type LocalizedApiValue = string | LocalizedTextPayload;

export interface BranchApiRecord {
  id: number;
  name: LocalizedApiValue;
  city: LocalizedApiValue | null;
  address: LocalizedApiValue | null;
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
  name: LocalizedTextPayload;
  city: LocalizedTextPayload;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  address: LocalizedTextPayload;
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
