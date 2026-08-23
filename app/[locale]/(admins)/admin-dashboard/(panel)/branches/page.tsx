import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminBranchesPage } from "@/components/admin/AdminBranchesPage";
import { fetchBranches } from "@services/branches/branchesService";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";

export default async function AdminBranchesRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialBranches: AdminBranchRecord[] | undefined;

  if (session?.accessToken) {
    try {
      const result = await fetchBranches(
        session.accessToken,
        locale,
        session.tokenType,
      );
      initialBranches = result.branches;
    } catch {
      initialBranches = undefined;
    }
  }

  return <AdminBranchesPage initialBranches={initialBranches} />;
}
