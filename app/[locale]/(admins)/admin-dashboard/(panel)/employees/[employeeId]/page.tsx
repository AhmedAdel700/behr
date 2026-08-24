import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminEmployeeDetailPage } from "@/components/admin/AdminEmployeeDetailPage";
import { fetchEmployee } from "@services/employees/employeesService";
import type { EmployeeRecord } from "@/types/EmployeesApiTypes";

interface AdminEmployeeDetailRouteProps {
  params: Promise<{ employeeId: string }>;
}

export default async function AdminEmployeeDetailRoute({
  params,
}: AdminEmployeeDetailRouteProps): Promise<ReactElement> {
  const { employeeId } = await params;
  const session = await auth();
  const locale = await getLocale();
  let initialData: EmployeeRecord | undefined;

  if (session?.accessToken && employeeId) {
    try {
      initialData = await fetchEmployee(
        session.accessToken,
        locale,
        employeeId,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return (
    <AdminEmployeeDetailPage
      employeeId={employeeId}
      initialData={initialData}
    />
  );
}
