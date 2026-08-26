import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminDepartmentDetailPage } from "@/components/admin/AdminDepartmentDetailPage";
import { fetchDepartmentById } from "@services/departments/departmentsService";
import { fetchEmployees } from "@services/employees/employeesService";
import type { DepartmentRecord } from "@/types/DepartmentsApiTypes";
import type { EmployeesListResult } from "@/types/EmployeesApiTypes";

interface AdminDepartmentDetailRouteProps {
  params: Promise<{ departmentId: string }>;
}

export default async function AdminDepartmentDetailRoute({
  params,
}: AdminDepartmentDetailRouteProps): Promise<ReactElement> {
  const { departmentId } = await params;
  const session = await auth();
  const locale = await getLocale();
  let initialData: DepartmentRecord | undefined;
  let initialEmployees: EmployeesListResult | undefined;

  if (session?.accessToken && departmentId) {
    try {
      initialData = await fetchDepartmentById(
        session.accessToken,
        locale,
        departmentId,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }

    try {
      initialEmployees = await fetchEmployees(
        session.accessToken,
        locale,
        session.tokenType,
        { department_id: departmentId },
      );
    } catch {
      initialEmployees = undefined;
    }
  }

  return (
    <AdminDepartmentDetailPage
      departmentId={departmentId}
      initialData={initialData}
      initialEmployees={initialEmployees}
    />
  );
}
