"use client";

import type { ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MainButton } from "@/components/shared/MainButton";
import {
  useGetDepartmentByIdQuery,
} from "@/app/store/api/departments/departmentsApi";

export function AdminDepartmentDetailPage(): ReactElement {
  const t = useTranslations("admin.departmentDetailPage");
  const tEmployees = useTranslations("admin.employees");
  const params = useParams();

  const departmentParam = params.departmentId;
  const departmentId =
    typeof departmentParam === "string" ? departmentParam : "";
  const { data: department } = useGetDepartmentByIdQuery(departmentId, {
    skip: !departmentId,
  });

  if (!department) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("notFoundTitle")}
        </h1>
        <p className="text-sm text-text-secondary">{t("notFoundDescription")}</p>
        <MainButton variant="primary" size="sm" link="/admin-dashboard/departments">
          {t("backToDepartments")}
        </MainButton>
      </div>
    );
  }

  const otherMemberCount = Math.max(
    0,
    department.usersCount - (department.managerUserId ? 1 : 0),
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <MainButton
          variant="ghost-brand"
          size="sm"
          startIcon={<ArrowLeft className="size-4 rtl:rotate-180" />}
          link="/admin-dashboard/departments"
        >
          {t("backToDepartments")}
        </MainButton>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {department.name}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("subtitle", {
              branch: department.branchName || "—",
              manager: department.managerName || "—",
              count: otherMemberCount,
            })}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("columns.name")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("columns.contact")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("columns.position")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-primary-200 bg-primary-50/50">
                  <td className="px-4 py-3 text-start">
                    <p className="font-semibold text-ink">{department.managerName || "—"}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {t("managerLabel")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-start">
                    <p className="text-ink">{department.managerEmail || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-start font-medium text-primary-700">
                    —
                  </td>
                </tr>

                {otherMemberCount === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {t("emptyMembers")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
