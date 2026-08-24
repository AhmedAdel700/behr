import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminEmployeesPage } from "@/components/admin/AdminEmployeesPage";
import { fetchEmployees } from "@services/employees/employeesService";
import type { EmployeesListResult } from "@/types/EmployeesApiTypes";

export default async function AdminEmployeesRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: EmployeesListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchEmployees(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminEmployeesPage initialData={initialData} />;
}
