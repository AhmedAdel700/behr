import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminDepartmentDetailPage } from "@/components/admin/AdminDepartmentDetailPage";
import { fetchDepartmentById } from "@services/departments/departmentsService";
import type { DepartmentRecord } from "@/types/DepartmentsApiTypes";

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
  }

  return (
    <AdminDepartmentDetailPage
      departmentId={departmentId}
      initialData={initialData}
    />
  );
}
