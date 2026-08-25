export interface ListQueryParams {
  search?: string;
  page?: number;
  branch_id?: string;
  department_id?: string;
  status?: string;
}

export function appendListQueryParams(
  baseUrl: string,
  params?: ListQueryParams,
): string {
  if (!params) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  const search = params.search?.trim();

  if (search) {
    searchParams.set("search", search);
  }

  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const branchId = params.branch_id?.trim();
  if (branchId) {
    searchParams.set("branch_id", branchId);
  }

  const status = params.status?.trim();
  if (status) {
    searchParams.set("status", status);
  }

  const departmentId = params.department_id?.trim();
  if (departmentId) {
    searchParams.set("department_id", departmentId);
  }

  const query = searchParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}
