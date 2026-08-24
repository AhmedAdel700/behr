import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminPositionsPage } from "@/components/admin/AdminPositionsPage";
import { fetchPositions } from "@services/positions/positionsService";
import type { PositionsListResult } from "@/types/PositionsApiTypes";

export default async function AdminPositionsRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: PositionsListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchPositions(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminPositionsPage initialData={initialData} />;
}
