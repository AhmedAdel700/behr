"use client";

import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactElement,
} from "react";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  DEFAULT_BRANCHES_LIST_PARAMS,
  useGetBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import {
  normalizeDepartmentsListParams,
  useGetDepartmentsQuery,
} from "@/app/store/api/departments/departmentsApi";
import {
  DEFAULT_EMPLOYEES_LIST_PARAMS,
  employeesApi,
  normalizeEmployeesListParams,
  useDeleteEmployeeMutation,
  useGetEmployeesQuery,
} from "@/app/store/api/employees/employeesApi";
import type { AppDispatch } from "@/app/store/store";
import { EditEmployeeAssignmentModal } from "@/components/admin/EditEmployeeAssignmentModal";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { MainButton } from "@/components/shared/MainButton";
import { MainSelect } from "@/components/shared/MainSelect";
import { SearchInput } from "@/components/shared/SearchInput";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import {
  getAdminSessionSnapshot,
  subscribeAdminSession,
} from "@/lib/admin/adminSessionStore";
import { canManageEmployees } from "@/lib/admin/permissions";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import type {
  EmployeeRecord,
  EmployeesListQueryParams,
  EmployeesListResult,
} from "@/types/EmployeesApiTypes";

export function AdminEmployeesPage({
  initialData,
}: {
  initialData?: EmployeesListResult;
}): ReactElement {
  const t = useTranslations("admin.employees");
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionSnapshot,
    getAdminSessionSnapshot,
  );

  const admin = getAdminSessionSnapshot();
  const canManage = canManageEmployees(admin.role);

  const { triggerRef: editEmployeeTriggerRef, bindTrigger: bindEditEmployeeTrigger } =
    useModalTriggerRef();
  const { triggerRef: deleteEmployeeTriggerRef, bindTrigger: bindDeleteEmployeeTrigger } =
    useModalTriggerRef();

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EmployeeRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const employeesQueryArg: EmployeesListQueryParams =
    normalizeEmployeesListParams({
      page,
      search: searchQuery,
      branch_id: canManage && branchFilter !== "all" ? branchFilter : undefined,
      department_id:
        canManage && departmentFilter !== "all" ? departmentFilter : undefined,
    });

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      employeesApi.util.upsertQueryData(
        "getEmployees",
        DEFAULT_EMPLOYEES_LIST_PARAMS,
        initialData,
      ),
    );
  }

  const { data: branchesResult } = useGetBranchesQuery(
    DEFAULT_BRANCHES_LIST_PARAMS,
    { skip: !canManage },
  );
  const { data: departmentsResult } = useGetDepartmentsQuery(
    normalizeDepartmentsListParams({
      page: 1,
      branch_id: branchFilter === "all" ? undefined : branchFilter,
    }),
    { skip: !canManage },
  );
  const {
    data: employeesResult,
    isLoading,
    isFetching,
  } = useGetEmployeesQuery(employeesQueryArg);
  const [deleteEmployeeMutation, { isLoading: deletingEmployee }] =
    useDeleteEmployeeMutation();

  const branches = branchesResult?.branches ?? [];
  const departments = departmentsResult?.departments ?? [];
  const employees =
    employeesResult?.employees ?? initialData?.employees ?? [];
  const meta = employeesResult?.meta ?? initialData?.meta;

  const deleteTarget = deleteId
    ? (employees.find((item) => item.id === deleteId) ?? null)
    : null;

  const departmentOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allDepartments") },
      ...departments.map((department) => ({
        value: department.id,
        label: department.name,
      })),
    ],
    [departments, t],
  );

  const branchOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allBranches") },
      ...branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    ],
    [branches, t],
  );

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleDepartmentFilterChange = (value: string): void => {
    setDepartmentFilter(value);
    setPage(1);
  };

  const handleBranchFilterChange = (value: string): void => {
    setBranchFilter(value);
    setDepartmentFilter("all");
    setPage(1);
  };

  const hasActiveFilters =
    canManage && (departmentFilter !== "all" || branchFilter !== "all");

  const clearFilters = (): void => {
    setDepartmentFilter("all");
    setBranchFilter("all");
    setPage(1);
  };

  const openEdit = (
    employee: EmployeeRecord,
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    bindEditEmployeeTrigger(event);
    setEditing(employee);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteId) {
      return;
    }

    try {
      const result = await deleteEmployeeMutation({ employeeId: deleteId }).unwrap();
      toast.success(result.message || t("deleteSuccess"));
      setDeleteId(null);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        typeof error.error === "string" &&
        error.error.trim()
          ? error.error
          : t("deleteError");
      toast.error(message);
    }
  };

  const isInitialQuery =
    page === 1 &&
    searchQuery.trim().length === 0 &&
    branchFilter === "all" &&
    departmentFilter === "all";
  const hasSeededInitialData = initialData !== undefined;
  const isTableLoading =
    (isLoading || isFetching) && !(isInitialQuery && hasSeededInitialData);

  const columnCount = 7;
  const emptyMessage =
    searchQuery.trim() || hasActiveFilters
      ? t("noResults")
      : t("emptyEmployees");

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">
          {canManage ? t("subtitleSuperAdmin") : t("subtitleManager")}
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
          <div className="w-full lg:max-w-xs lg:shrink-0">
            <SearchInput
              onSearch={handleSearch}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-3 lg:min-w-0 lg:flex-1 lg:flex-row lg:items-center lg:gap-3">
            {canManage ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="min-w-0 flex-1 lg:w-40 lg:flex-none">
                    <MainSelect
                      value={branchFilter}
                      onValueChange={handleBranchFilterChange}
                      options={branchOptions}
                      placeholder={t("filters.branch")}
                    />
                  </div>
                  <div className="min-w-0 flex-1 lg:w-40 lg:flex-none">
                    <MainSelect
                      value={departmentFilter}
                      onValueChange={handleDepartmentFilterChange}
                      options={departmentOptions}
                      placeholder={t("filters.department")}
                    />
                  </div>
                </div>
                {hasActiveFilters ? (
                  <MainButton
                    variant="ghost-brand"
                    size="sm"
                    type="button"
                    className="hidden lg:inline-flex"
                    onClick={clearFilters}
                  >
                    {t("filters.clear")}
                  </MainButton>
                ) : null}
              </div>
            ) : null}
            <div className="flex w-full items-center gap-3 lg:w-auto lg:ms-auto">
              {hasActiveFilters ? (
                <MainButton
                  variant="ghost-brand"
                  size="sm"
                  type="button"
                  className="lg:hidden"
                  onClick={clearFilters}
                >
                  {t("filters.clear")}
                </MainButton>
              ) : null}
              <p className="ms-auto shrink-0 text-sm font-semibold text-ink lg:ms-0">
                {t("resultsTitle", { count: meta?.total ?? employees.length })}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="min-w-48 px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.name")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.contact")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.fingerprintNumber")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.position")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.department")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.departmentManager")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isTableLoading ? (
                  <TableSkeleton columnCount={columnCount} />
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="min-w-48 px-4 py-3 text-start">
                        <p className="font-medium text-ink">
                          {employee.fullName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-start">
                        <p className="text-ink">{employee.email}</p>
                        <p className="text-xs text-text-muted">
                          {employee.phone || t("notAssigned")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-start font-mono text-sm tabular-nums text-text-secondary">
                        {employee.fingerprintNumber || t("notAssigned")}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {employee.jobPosition?.name ?? t("notAssigned")}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {employee.department?.name ?? t("notAssigned")}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {employee.department?.manager?.fullName ??
                          t("notAssigned")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-start gap-2">
                          <MainButton
                            variant="edit-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("view")}
                            startIcon={<Eye className="size-4" />}
                            onClick={() =>
                              router.push(
                                `/admin-dashboard/employees/${employee.id}`,
                              )
                            }
                          />
                          {canManage ? (
                            <>
                              <MainButton
                                variant="edit-soft"
                                size="sm"
                                iconOnly
                                aria-label={t("edit")}
                                startIcon={<Pencil className="size-4" />}
                                onClick={(event) => openEdit(employee, event)}
                              />
                              <MainButton
                                variant="delete-soft"
                                size="sm"
                                iconOnly
                                aria-label={t("delete")}
                                startIcon={<Trash2 className="size-4" />}
                                onClick={(event) => {
                                  bindDeleteEmployeeTrigger(event);
                                  setDeleteId(employee.id);
                                }}
                              />
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
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
              previousLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
              formatSummary={({ start, end, total }) =>
                t("pagination.summary", { start, end, total })
              }
            />
          ) : null}
        </div>
      </section>

      {editing ? (
        <EditEmployeeAssignmentModal
          employee={editing}
          open={editing !== null}
          onClose={() => setEditing(null)}
          triggerRef={editEmployeeTriggerRef}
        />
      ) : null}

      <DeleteConfirmModal
        open={deleteTarget !== null}
        title={t("deleteTitle")}
        description={
          deleteTarget
            ? t("deleteDescription", { name: deleteTarget.fullName })
            : ""
        }
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          void confirmDelete();
          return false;
        }}
        loading={deletingEmployee}
        triggerRef={deleteEmployeeTriggerRef}
      />
    </div>
  );
}
