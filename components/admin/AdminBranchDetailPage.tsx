"use client";

import { useMemo, useState, useSyncExternalStore, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MainButton } from "@/components/shared/MainButton";
import { MainInput } from "@/components/shared/MainInput";
import { BranchMapPicker } from "@/components/shared/BranchMapPicker";
import { getBranchOverview } from "@/lib/admin/buildBranchOverviews";
import {
  getEmployeesSnapshot,
  subscribeEmployees,
} from "@/lib/admin/adminDataStore";
import {
  getBranchById,
  getBranchDepartmentsSnapshot,
  getBranchesSnapshot,
  subscribeOrg,
} from "@/lib/admin/adminOrgStore";
import { searchDepartmentSummaries } from "@/lib/admin/searchDepartmentSummaries";

export function AdminBranchDetailPage(): ReactElement {
  const t = useTranslations("admin.branchDetailPage");
  const params = useParams();

  useSyncExternalStore(subscribeEmployees, getEmployeesSnapshot, getEmployeesSnapshot);
  useSyncExternalStore(subscribeOrg, getBranchesSnapshot, getBranchesSnapshot);
  useSyncExternalStore(subscribeOrg, getBranchDepartmentsSnapshot, getBranchDepartmentsSnapshot);

  const branchParam = params.branchId;
  const branchId = typeof branchParam === "string" ? branchParam : "";
  const [searchQuery, setSearchQuery] = useState("");

  const employees = getEmployeesSnapshot();
  const branch = branchId ? getBranchById(branchId) : undefined;
  const overview = branch ? getBranchOverview(branch.slug, employees) : undefined;

  const filteredDepartments = useMemo(
    () => searchDepartmentSummaries(overview?.departments ?? [], searchQuery),
    [overview?.departments, searchQuery]
  );

  if (!branch || !overview) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("notFoundTitle")}
        </h1>
        <p className="text-sm text-text-secondary">{t("notFoundDescription")}</p>
        <MainButton variant="primary" size="sm" link="/admin-dashboard/branches">
          {t("backToBranches")}
        </MainButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <MainButton
          variant="ghost-brand"
          size="sm"
          startIcon={<ArrowLeft className="size-4 rtl:rotate-180" />}
          link="/admin-dashboard/branches"
        >
          {t("backToBranches")}
        </MainButton>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {branch.name}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("subtitle", {
              city: branch.city,
              departments: overview.departments.length,
              employees: overview.employeeCount,
            })}
          </p>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-ink">{t("locationTitle")}</h2>
          <p className="text-sm text-text-secondary">{branch.address}</p>
        </div>
        <BranchMapPicker
          active
          readOnly
          title={branch.name}
          address={branch.address}
          value={{
            latitude: branch.latitude,
            longitude: branch.longitude,
          }}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <MainInput
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              startIcon={<Search />}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <h2 className="text-sm font-semibold text-ink">
            {t("departmentsTitle", { count: filteredDepartments.length })}
          </h2>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.department")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.manager")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.members")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {overview.departments.length === 0
                        ? t("emptyDepartments")
                        : t("emptySearch")}
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((department) => (
                    <tr
                      key={department.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 text-start">
                        <Link
                          href={`/admin-dashboard/departments/${department.id}`}
                          className="font-medium text-primary-700 hover:text-primary-800"
                        >
                          {department.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-start">
                        <p className="text-ink">{department.manager.name}</p>
                        <p className="text-xs text-text-muted">
                          {department.manager.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {department.memberCount}
                      </td>
                      <td className="px-4 py-3">
                        <MainButton
                          variant="edit-soft"
                          size="sm"
                          iconOnly
                          aria-label={t("viewDepartment")}
                          startIcon={<Eye className="size-4" />}
                          link={`/admin-dashboard/departments/${department.id}`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
