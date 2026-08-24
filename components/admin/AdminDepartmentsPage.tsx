"use client";

import { useMemo, useRef, useState, type MouseEvent, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  DEFAULT_BRANCHES_LIST_PARAMS,
  useGetBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import {
  normalizeDepartmentsListParams,
  useDeleteDepartmentMutation,
  useGetDepartmentsQuery,
} from "@/app/store/api/departments/departmentsApi";
import { CreateDepartmentModal } from "@/components/admin/CreateDepartmentModal";
import { EditDepartmentModal } from "@/components/admin/EditDepartmentModal";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { MainButton } from "@/components/shared/MainButton";
import { MainSelect } from "@/components/shared/MainSelect";
import { SearchInput } from "@/components/shared/SearchInput";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import type {
  DepartmentRecord,
  DepartmentsListQueryParams,
  DepartmentsListResult,
} from "@/types/DepartmentsApiTypes";

export function AdminDepartmentsPage({
  initialData,
}: {
  initialData?: DepartmentsListResult;
}): ReactElement {
  const t = useTranslations("admin.departmentsPage");
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [page, setPage] = useState(1);
  const createDepartmentTriggerRef = useRef<HTMLButtonElement>(null);
  const { triggerRef: editDepartmentTriggerRef, bindTrigger: bindEditDepartmentTrigger } =
    useModalTriggerRef();
  const { triggerRef: deleteDepartmentTriggerRef, bindTrigger: bindDeleteDepartmentTrigger } =
    useModalTriggerRef();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const departmentsQueryArg: DepartmentsListQueryParams =
    normalizeDepartmentsListParams({
      page,
      search: searchQuery,
      branch_id: branchFilter === "all" ? undefined : branchFilter,
    });

  const { data: branchesResult } = useGetBranchesQuery(DEFAULT_BRANCHES_LIST_PARAMS);
  const {
    data: departmentsResult,
    isLoading,
    isFetching,
  } = useGetDepartmentsQuery(departmentsQueryArg);
  const [deleteDepartmentMutation, { isLoading: deletingDepartment }] =
    useDeleteDepartmentMutation();

  const branches = branchesResult?.branches ?? [];
  const departments =
    departmentsResult?.departments ?? initialData?.departments ?? [];
  const meta = departmentsResult?.meta ?? initialData?.meta;

  const branchFilterOptions = useMemo(
    () => [
      { value: "all", label: t("filters.allBranches") },
      ...branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    ],
    [branches, t]
  );

  const deleteTarget = deleteId
    ? departments.find((department) => department.id === deleteId) ?? null
    : null;

  const openEdit = (
    department: DepartmentRecord,
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    bindEditDepartmentTrigger(event);
    setEditing(department);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteId) {
      return;
    }

    await deleteDepartmentMutation({ departmentId: deleteId }).unwrap();
    setDeleteId(null);
  };

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleBranchFilterChange = (value: string): void => {
    setBranchFilter(value);
    setPage(1);
  };

  const isInitialQuery =
    page === 1 && searchQuery.trim().length === 0 && branchFilter === "all";
  const hasSeededInitialData = Boolean(initialData?.departments?.length);
  const isTableLoading =
    (isLoading || isFetching) && !(isInitialQuery && hasSeededInitialData);

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
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
            <div className="min-w-0 flex-1 lg:w-40 lg:flex-none">
              <MainSelect
                value={branchFilter}
                onValueChange={handleBranchFilterChange}
                options={branchFilterOptions}
                placeholder={t("filters.branch")}
              />
            </div>
            <div className="flex w-full items-center gap-3 lg:ms-auto lg:w-auto">
              <h2 className="ms-auto shrink-0 text-sm font-semibold text-ink lg:ms-0">
                {t("departmentsTitle", { count: meta?.total ?? departments.length })}
              </h2>
              <MainButton
                ref={createDepartmentTriggerRef}
                variant="primary"
                size="sm"
                startIcon={<Plus className="size-4" />}
                onClick={() => setCreating(true)}
              >
                {t("createDepartment")}
              </MainButton>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.department")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.branch")}
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
                {isTableLoading ? (
                  <TableSkeleton columnCount={5} />
                ) : departments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {searchQuery.trim() || branchFilter !== "all"
                        ? t("emptySearch")
                        : t("emptyDepartments")}
                    </td>
                  </tr>
                ) : (
                  departments.map((department) => {
                    return (
                      <tr
                        key={department.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-3 text-start font-medium text-ink">
                          {department.name}
                        </td>
                        <td className="px-4 py-3 text-start text-text-secondary">
                          {department.branchName || "—"}
                        </td>
                        <td className="px-4 py-3 text-start">
                          <p className="text-ink">{department.managerName || "—"}</p>
                          <p className="text-xs text-text-muted">
                            {department.managerEmail || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-start text-text-secondary">
                          {department.usersCount}
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
                                  `/admin-dashboard/departments/${department.id}`
                                )
                              }
                            />
                            <MainButton
                              variant="edit-soft"
                              size="sm"
                              iconOnly
                              aria-label={t("edit")}
                              startIcon={<Pencil className="size-4" />}
                              onClick={(event) => openEdit(department, event)}
                            />
                            <MainButton
                              variant="delete-soft"
                              size="sm"
                              iconOnly
                              aria-label={t("delete")}
                              startIcon={<Trash2 className="size-4" />}
                              onClick={(event) => {
                                bindDeleteDepartmentTrigger(event);
                                setDeleteId(department.id);
                              }}
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
        <EditDepartmentModal
          department={editing}
          open={editing !== null}
          onClose={() => setEditing(null)}
          triggerRef={editDepartmentTriggerRef}
        />
      ) : null}

      <CreateDepartmentModal
        open={creating}
        onClose={() => setCreating(false)}
        triggerRef={createDepartmentTriggerRef}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        title={t("deleteTitle")}
        description={
          deleteTarget
            ? t("deleteDescription", { name: deleteTarget.name })
            : ""
        }
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          void confirmDelete();
          return false;
        }}
        loading={deletingDepartment}
        triggerRef={deleteDepartmentTriggerRef}
      />
    </div>
  );
}
