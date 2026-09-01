import type {
  ApiItemResponse,
  ApiListResponse,
  ApiPaginationMeta,
  LocalizedApiObject,
  LocalizedApiValue,
  LocalizedTextPayload,
} from "@/types/ApiSharedTypes";

export type {
  LocalizedApiObject,
  LocalizedApiValue,
  LocalizedTextPayload,
};

export interface PositionApiRecord {
  id: number;
  name: LocalizedApiValue;
  created_at: string;
  updated_at: string;
}

export interface PositionRecord {
  id: string;
  name: string;
  nameLocalized: LocalizedTextPayload;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PositionsPaginationMeta = ApiPaginationMeta;

export interface PositionsListQueryParams {
  search?: string;
  page?: number;
}

export interface PositionsListResult {
  positions: PositionRecord[];
  meta: PositionsPaginationMeta;
}

export type PositionsListApiResponse = ApiListResponse<PositionApiRecord>;

export type PositionApiResponse = ApiItemResponse<PositionApiRecord>;

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
