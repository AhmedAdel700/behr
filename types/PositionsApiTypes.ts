import type { BranchesPaginationMeta } from "@/types/BranchesApiTypes";

export interface PositionApiRecord {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PositionRecord {
  id: string;
  name: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PositionsListQueryParams {
  search?: string;
  page?: number;
}

export interface PositionsListResult {
  positions: PositionRecord[];
  meta: BranchesPaginationMeta;
}

export interface PositionPayload {
  name: string;
}

export interface PositionMutationResult {
  position: PositionRecord;
  message: string;
}

export interface PositionDeleteResult {
  message: string;
}

export class PositionsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PositionsApiError";
  }
}
