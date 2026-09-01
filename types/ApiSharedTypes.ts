/** Partial bilingual object returned by admin list/detail endpoints. */
export interface LocalizedApiObject {
  en?: string;
  ar?: string;
}

/** Localized field as returned by the API: either a resolved string or a locale map. */
export type LocalizedApiValue = string | LocalizedApiObject;

/** Full bilingual payload for create/update requests. */
export interface LocalizedTextPayload {
  en: string;
  ar: string;
}

/** Laravel count fields are often serialized as strings. */
export type ApiCountValue = string | number;

/** Laravel boolean fields may arrive as booleans or 0/1. */
export type ApiBooleanValue = boolean | 0 | 1;

export interface ApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiListResponse<TRecord> {
  success: boolean;
  message: string;
  data: TRecord[] | null;
  meta: ApiPaginationMeta;
}

export interface ApiItemResponse<TRecord> {
  success: boolean;
  message: string;
  data: TRecord | null;
}
