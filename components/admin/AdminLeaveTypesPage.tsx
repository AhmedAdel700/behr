"use client";

import { useRef, useState, type MouseEvent, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { Building2, CircleAlert, MapPinned, Pencil, Plus, Trash2 } from "lucide-react";
import {
  AssignLeaveBalancesModal,
  type AssignLeaveBalancesMode,
} from "@/components/admin/AssignLeaveBalancesModal";
import {
  DEFAULT_LEAVE_TYPES_LIST_PARAMS,
  leaveTypesApi,
  normalizeLeaveTypesListParams,
  useDeleteLeaveTypeMutation,
  useGetLeaveTypesQuery,
} from "@/app/store/api/leave-types/leaveTypesApi";
import { useGetAllBranchesQuery } from "@/app/store/api/branches/branchesApi";
import type { AppDispatch } from "@/app/store/store";
import { CreateLeaveTypeModal } from "@/components/admin/CreateLeaveTypeModal";
import { EditLeaveTypeModal } from "@/components/admin/EditLeaveTypeModal";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { MainButton } from "@/components/shared/MainButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import { cn } from "@/lib/utils";
import type {
  LeaveTypeRecord,
  LeaveTypesListQueryParams,
  LeaveTypesListResult,
} from "@/types/LeaveTypesApiTypes";

type LeaveTypeStatusTone = "success" | "danger" | "info" | "neutral";

function LeaveTypeStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: LeaveTypeStatusTone;
}): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-[6.75rem] shrink-0 items-center justify-center rounded-none px-1 text-center text-[11px] font-semibold leading-none",
        tone === "success" && "bg-success-50 text-success-700",
        tone === "danger" && "bg-danger-50 text-danger-700",
        tone === "info" && "bg-info-50 text-info-700",
        tone === "neutral" && "bg-neutral-100 text-neutral-600",
      )}
    >
      {label}
    </span>
  );
}

export function AdminLeaveTypesPage({
  initialData,
}: {
  initialData?: LeaveTypesListResult;
}): ReactElement {
  const t = useTranslations("admin.leaveTypesPage");
  const tForm = useTranslations("admin.createLeaveType");
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  const createLeaveTypeTriggerRef = useRef<HTMLButtonElement>(null);
  const { triggerRef: editLeaveTypeTriggerRef, bindTrigger: bindEditLeaveTypeTrigger } =
    useModalTriggerRef();
  const { triggerRef: deleteLeaveTypeTriggerRef, bindTrigger: bindDeleteLeaveTypeTrigger } =
    useModalTriggerRef();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [assignMode, setAssignMode] = useState<AssignLeaveBalancesMode | null>(
    null,
  );
  const [editing, setEditing] = useState<LeaveTypeRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useGetAllBranchesQuery(undefined, { refetchOnMountOrArgChange: true });

  const leaveTypesQueryArg: LeaveTypesListQueryParams =
    normalizeLeaveTypesListParams({
      page,
      search: searchQuery,
    });

  if (initialData && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      leaveTypesApi.util.upsertQueryData(
        "getLeaveTypes",
        DEFAULT_LEAVE_TYPES_LIST_PARAMS,
        initialData,
      ),
    );
  }

  const {
    data: leaveTypesResult,
    isLoading,
    isFetching,
  } = useGetLeaveTypesQuery(leaveTypesQueryArg);
  const [deleteLeaveTypeMutation, { isLoading: deletingLeaveType }] =
    useDeleteLeaveTypeMutation();

  const leaveTypes =
    leaveTypesResult?.leaveTypes ?? initialData?.leaveTypes ?? [];
  const meta = leaveTypesResult?.meta ?? initialData?.meta;

  const deleteTarget = deleteId
    ? (leaveTypes.find((item) => item.id === deleteId) ?? null)
    : null;

  const openEdit = (
    leaveType: LeaveTypeRecord,
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    bindEditLeaveTypeTrigger(event);
    setEditing(leaveType);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteId) {
      return;
    }

    await deleteLeaveTypeMutation({ leaveTypeId: deleteId }).unwrap();
    setDeleteId(null);
  };

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setPage(1);
  };

  const isInitialQuery = page === 1 && searchQuery.trim().length === 0;
  const hasSeededInitialData = initialData !== undefined;
  const isTableLoading =
    (isLoading || isFetching) && !(isInitialQuery && hasSeededInitialData);

  const columnCount = 5;

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-text-secondary">{t("subtitle")}</p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <SearchInput
              onSearch={handleSearch}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <h2 className="text-sm font-semibold text-ink sm:me-auto lg:me-0">
              {t("resultsTitle", { count: meta?.total ?? leaveTypes.length })}
            </h2>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <MainButton
                variant="outline"
                size="sm"
                startIcon={<Building2 className="size-4" />}
                onClick={() => setAssignMode("department")}
              >
                {t("assignByDepartment")}
              </MainButton>
              <MainButton
                variant="outline"
                size="sm"
                startIcon={<MapPinned className="size-4" />}
                onClick={() => setAssignMode("branch")}
              >
                {t("assignByBranch")}
              </MainButton>
              <MainButton
                ref={createLeaveTypeTriggerRef}
                variant="primary"
                size="sm"
                startIcon={<Plus className="size-4" />}
                onClick={() => setCreating(true)}
              >
                {t("create")}
              </MainButton>
            </div>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2.5 text-sm text-primary-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t("assignHint")}</span>
        </p>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.name")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.allocation")}
                  </th>
                  <th className="min-w-24 px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.unit")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.status")}
                  </th>
                  <th className="px-4 py-4 text-end text-xs font-semibold text-text-muted">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isTableLoading ? (
                  <TableSkeleton columnCount={columnCount} />
                ) : leaveTypes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {searchQuery.trim() ? t("noResults") : t("empty")}
                    </td>
                  </tr>
                ) : (
                  leaveTypes.map((leaveType) => (
                    <tr
                      key={leaveType.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 text-start">
                        <p className="font-medium text-ink">{leaveType.name}</p>
                        {leaveType.description ? (
                          <p className="mt-0.5 max-w-xs text-xs text-text-muted">
                            {leaveType.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        <p>
                          {leaveType.allocationAmount} ·{" "}
                          {tForm(
                            `options.allocationType.${leaveType.allocationType}`,
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {leaveType.canCarryForward
                            ? t("carryForward", {
                                limit: leaveType.carryForwardLimit ?? 0,
                              })
                            : t("noCarryForward")}
                        </p>
                      </td>
                      <td className="min-w-24 px-4 py-3 text-start text-text-secondary">
                        {tForm(`options.unit.${leaveType.unit}`)}
                      </td>
                      <td className="px-4 py-3 text-start">
                        <div className="flex gap-1.5">
                          <LeaveTypeStatusBadge
                            label={leaveType.isPaid ? t("paid") : t("unpaid")}
                            tone={leaveType.isPaid ? "success" : "danger"}
                          />
                          <LeaveTypeStatusBadge
                            label={
                              leaveType.isActive ? t("active") : t("inactive")
                            }
                            tone={leaveType.isActive ? "info" : "neutral"}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <MainButton
                            variant="edit-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("edit")}
                            startIcon={<Pencil className="size-4" />}
                            onClick={(event) => openEdit(leaveType, event)}
                          />
                          <MainButton
                            variant="delete-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("delete")}
                            startIcon={<Trash2 className="size-4" />}
                            onClick={(event) => {
                              bindDeleteLeaveTypeTrigger(event);
                              setDeleteId(leaveType.id);
                            }}
                          />
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

      <AssignLeaveBalancesModal
        open={assignMode !== null}
        mode={assignMode ?? "branch"}
        onClose={() => setAssignMode(null)}
      />

      <CreateLeaveTypeModal
        open={creating}
        onClose={() => setCreating(false)}
        triggerRef={createLeaveTypeTriggerRef}
      />

      {editing ? (
        <EditLeaveTypeModal
          leaveType={editing}
          open={editing !== null}
          onClose={() => setEditing(null)}
          triggerRef={editLeaveTypeTriggerRef}
        />
      ) : null}

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
        loading={deletingLeaveType}
        triggerRef={deleteLeaveTypeTriggerRef}
      />
    </div>
  );
}
