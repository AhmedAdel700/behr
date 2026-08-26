"use client";

import { useRef, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { useDispatch } from "react-redux";
import { ArrowLeft, Eye } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  departmentsApi,
  useGetDepartmentByIdQuery,
} from "@/app/store/api/departments/departmentsApi";
import {
  employeesApi,
  normalizeEmployeesListParams,
  useGetEmployeesQuery,
} from "@/app/store/api/employees/employeesApi";
import type { AppDispatch } from "@/app/store/store";
import { MainButton } from "@/components/shared/MainButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import type { DepartmentRecord } from "@/types/DepartmentsApiTypes";
import type {
  EmployeeRecord,
  EmployeesListQueryParams,
  EmployeesListResult,
} from "@/types/EmployeesApiTypes";

function managerRecordFromDepartment(
  department: DepartmentRecord,
): EmployeeRecord {
  return {
    id: department.managerUserId,
    fullName: department.managerName,
    email: department.managerEmail,
    phone: "",
    fingerprintNumber: "",
    image: null,
    branch: department.branchId
      ? {
          id: department.branchId,
          name: department.branchName,
          city: department.branchCity,
        }
      : null,
    department: {
      id: department.id,
      name: department.name,
      manager: department.managerUserId
        ? {
            id: department.managerUserId,
            fullName: department.managerName,
            email: department.managerEmail,
          }
        : null,
    },
    jobPosition: null,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}

function employeesWithManagerFirst(
  employees: EmployeeRecord[],
  department: DepartmentRecord,
): EmployeeRecord[] {
  const managerId = department.managerUserId.trim();
  if (!managerId) {
    return employees;
  }

  const managerFromList = employees.find((employee) => employee.id === managerId);
  const others = employees.filter((employee) => employee.id !== managerId);
  const manager = managerFromList ?? managerRecordFromDepartment(department);

  return [manager, ...others];
}

interface AdminDepartmentDetailPageProps {
  departmentId: string;
  initialData?: DepartmentRecord;
  initialEmployees?: EmployeesListResult;
}

export function AdminDepartmentDetailPage({
  departmentId,
  initialData,
  initialEmployees,
}: AdminDepartmentDetailPageProps): ReactElement {
  const t = useTranslations("admin.departmentDetailPage");
  const tEmployees = useTranslations("admin.employees");
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedDepartment = useRef(false);
  const didSeedEmployees = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  if (initialData && departmentId && !didSeedDepartment.current) {
    didSeedDepartment.current = true;
    dispatch(
      departmentsApi.util.upsertQueryData(
        "getDepartmentById",
        departmentId,
        initialData,
      ),
    );
  }

  const employeesQueryArg: EmployeesListQueryParams =
    normalizeEmployeesListParams({
      page,
      search: searchQuery,
      department_id: departmentId,
    });

  if (initialEmployees && departmentId && !didSeedEmployees.current) {
    didSeedEmployees.current = true;
    dispatch(
      employeesApi.util.upsertQueryData(
        "getEmployees",
        normalizeEmployeesListParams({
          page: 1,
          department_id: departmentId,
        }),
        initialEmployees,
      ),
    );
  }

  const {
    data: departmentData,
    isLoading,
    isError,
  } = useGetDepartmentByIdQuery(departmentId, {
    skip: !departmentId,
  });

  const {
    data: employeesResult,
    isLoading: employeesLoading,
    isFetching: employeesFetching,
  } = useGetEmployeesQuery(employeesQueryArg, {
    skip: !departmentId,
  });

  const department = departmentData ?? initialData;
  const employees =
    employeesResult?.employees ?? initialEmployees?.employees ?? [];
  const meta = employeesResult?.meta ?? initialEmployees?.meta;
  const tableEmployees = department
    ? employeesWithManagerFirst(employees, department)
    : employees;

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setPage(1);
  };

  if (!departmentId || ((isError || !department) && !isLoading)) {
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

  if (!department) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <p className="text-sm text-text-secondary">{t("loading")}</p>
      </div>
    );
  }

  const isInitialEmployeesQuery =
    page === 1 && searchQuery.trim().length === 0;
  const isTableLoading =
    (employeesLoading || employeesFetching) &&
    !(isInitialEmployeesQuery && initialEmployees !== undefined);
  const columnCount = 6;
  const emptyMessage = searchQuery.trim() ? t("emptySearch") : t("emptyMembers");
  const memberCount = meta?.total ?? tableEmployees.length;

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
              count: memberCount,
            })}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <SearchInput
              onSearch={handleSearch}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <p className="text-sm font-semibold text-ink">
            {tEmployees("resultsTitle", { count: memberCount })}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("columns.name")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("fields.email")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("fields.phone")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("columns.fingerprintNumber")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("columns.position")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {tEmployees("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isTableLoading ? (
                  <TableSkeleton columnCount={columnCount} />
                ) : tableEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  tableEmployees.map((employee) => {
                    const isManager = employee.id === department.managerUserId;

                    return (
                      <tr
                        key={employee.id}
                        className={
                          isManager
                            ? "border-b border-primary-200 bg-primary-50/50 last:border-b-0"
                            : "border-b border-border last:border-b-0"
                        }
                      >
                        <td className="px-4 py-3 text-start">
                          <p className="font-medium text-ink">
                            {employee.fullName}
                          </p>
                          {isManager ? (
                            <p className="mt-0.5 text-xs text-text-secondary">
                              {t("managerLabel")}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-start text-ink">
                          {employee.email || tEmployees("notAssigned")}
                        </td>
                        <td className="px-4 py-3 text-start text-text-secondary">
                          {employee.phone || tEmployees("notAssigned")}
                        </td>
                        <td className="px-4 py-3 text-start font-mono text-sm tabular-nums text-text-secondary">
                          {employee.fingerprintNumber ||
                            tEmployees("notAssigned")}
                        </td>
                        <td className="px-4 py-3 text-start text-text-secondary">
                          {employee.jobPosition?.name ??
                            tEmployees("notAssigned")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-start">
                            <MainButton
                              variant="edit-soft"
                              size="sm"
                              iconOnly
                              aria-label={tEmployees("view")}
                              startIcon={<Eye className="size-4" />}
                              onClick={() =>
                                router.push(
                                  `/admin-dashboard/employees/${employee.id}`,
                                )
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isTableLoading && meta ? (
            <TablePagination
              page={meta.current_page}
              pageSize={meta.per_page}
              totalItems={meta.total}
              onPageChange={setPage}
              previousLabel={tEmployees("pagination.previous")}
              nextLabel={tEmployees("pagination.next")}
              formatSummary={({ start, end, total }) =>
                tEmployees("pagination.summary", { start, end, total })
              }
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
