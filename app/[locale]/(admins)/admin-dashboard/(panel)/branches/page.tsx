import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminBranchesPage } from "@/components/admin/AdminBranchesPage";
import { fetchBranches } from "@services/branches/branchesService";
import type { BranchesListResult } from "@/types/BranchesApiTypes";

export default async function AdminBranchesRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: BranchesListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchBranches(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminBranchesPage initialData={initialData} />;
}
