import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminBranchDetailPage } from "@/components/admin/AdminBranchDetailPage";
import { fetchBranchById } from "@services/branches/branchesService";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";

interface AdminBranchDetailRouteProps {
  params: Promise<{ branchId: string }>;
}

export default async function AdminBranchDetailRoute({
  params,
}: AdminBranchDetailRouteProps): Promise<ReactElement> {
  const { branchId } = await params;
  const session = await auth();
  const locale = await getLocale();
  let initialBranch: AdminBranchRecord | null = null;

  if (session?.accessToken && branchId) {
    try {
      initialBranch = await fetchBranchById(
        session.accessToken,
        locale,
        branchId,
        session.tokenType,
      );
    } catch {
      initialBranch = null;
    }
  }

  return (
    <AdminBranchDetailPage branchId={branchId} initialBranch={initialBranch} />
  );
}
