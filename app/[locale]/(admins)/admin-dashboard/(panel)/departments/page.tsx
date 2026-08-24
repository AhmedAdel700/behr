import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminDepartmentsPage } from "@/components/admin/AdminDepartmentsPage";
import { fetchDepartments } from "@services/departments/departmentsService";
import type { DepartmentsListResult } from "@/types/DepartmentsApiTypes";

export default async function AdminDepartmentsRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: DepartmentsListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchDepartments(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminDepartmentsPage initialData={initialData} />;
}
