import { createApiHttp } from "@services/http/apiHttp";
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

const api = createApiHttp(PublicOrgApiError, "public org server");

function assertNamedList(
  payload: unknown,
  fallbackMessage: string,
): PublicNamedApiRecord[] {
  const { data } = api.assertSuccessResponse<PublicNamedApiRecord[]>(
    payload,
    fallbackMessage,
  );

  if (!Array.isArray(data)) {
    throw new PublicOrgApiError(fallbackMessage);
  }

  return data;
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
  const { response, payload } = await api.authorizedFetch({
    url,
    lang,
    fallbackMessage,
    useJsonHeadersOnly: true,
  });

  if (!response.ok) {
    throw new PublicOrgApiError(api.parseApiMessage(payload, fallbackMessage));
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
