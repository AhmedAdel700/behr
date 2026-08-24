import { buildJsonHeaders } from "@services/auth/shared";
import {
  publicBranchDepartmentsUrl,
  publicBranchesUrl,
  publicJobPositionsUrl,
} from "@services/public/publicOrgPaths";
import type {
  PublicNamedApiRecord,
  PublicNamedRecord,
} from "@/types/PublicOrgApiTypes";
import { PublicOrgApiError } from "@/types/PublicOrgApiTypes";

function parseApiMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

function assertNamedList(
  payload: unknown,
  fallbackMessage: string,
): PublicNamedApiRecord[] {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    typeof payload.success !== "boolean"
  ) {
    throw new PublicOrgApiError(fallbackMessage);
  }

  const response = payload as {
    success: boolean;
    message: string;
    data: PublicNamedApiRecord[] | null;
  };

  if (!response.success || response.data === null) {
    throw new PublicOrgApiError(response.message || fallbackMessage);
  }

  if (!Array.isArray(response.data)) {
    throw new PublicOrgApiError(fallbackMessage);
  }

  return response.data;
}

function mapNamedRecord(record: PublicNamedApiRecord): PublicNamedRecord {
  return {
    id: String(record.id),
    name: record.name,
  };
}

async function fetchNamedList(
  url: string,
  lang: string,
  fallbackMessage: string,
): Promise<PublicNamedRecord[]> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: buildJsonHeaders(lang),
      cache: "no-store",
    });
  } catch {
    throw new PublicOrgApiError(fallbackMessage);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new PublicOrgApiError(parseApiMessage(payload, fallbackMessage));
  }

  return assertNamedList(payload, fallbackMessage).map(mapNamedRecord);
}

export async function fetchPublicBranches(
  lang: string,
): Promise<PublicNamedRecord[]> {
  return fetchNamedList(
    publicBranchesUrl(),
    lang,
    "Failed to load branches.",
  );
}

export async function fetchPublicBranchDepartments(
  lang: string,
  branchId: string,
): Promise<PublicNamedRecord[]> {
  return fetchNamedList(
    publicBranchDepartmentsUrl(branchId),
    lang,
    "Failed to load departments.",
  );
}

export function parsePublicNamedList(
  payload: unknown,
  fallbackMessage: string,
): PublicNamedRecord[] {
  return assertNamedList(payload, fallbackMessage).map(mapNamedRecord);
}

export async function fetchPublicJobPositions(
  lang: string,
): Promise<PublicNamedRecord[]> {
  return fetchNamedList(
    publicJobPositionsUrl(),
    lang,
    "Failed to load job positions.",
  );
}
