import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { fetchOverview } from "@services/overview/overviewService";
import type { OverviewResult } from "@/types/OverviewApiTypes";

export default async function AdminDashboardPage(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: OverviewResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchOverview(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminOverview initialData={initialData} />;
}
