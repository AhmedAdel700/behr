"use client";

import { useRef, useState, type MouseEvent, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  normalizePositionsListParams,
  useDeletePositionMutation,
  useGetPositionsQuery,
} from "@/app/store/api/positions/positionsApi";
import { CreatePositionModal } from "@/components/admin/CreatePositionModal";
import { EditPositionModal } from "@/components/admin/EditPositionModal";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { MainButton } from "@/components/shared/MainButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { TablePagination } from "@/components/shared/TablePagination";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import type {
  PositionRecord,
  PositionsListQueryParams,
  PositionsListResult,
} from "@/types/PositionsApiTypes";

export function AdminPositionsPage({
  initialData,
}: {
  initialData?: PositionsListResult;
}): ReactElement {
  const t = useTranslations("admin.positionsPage");

  const createPositionTriggerRef = useRef<HTMLButtonElement>(null);
  const { triggerRef: editPositionTriggerRef, bindTrigger: bindEditPositionTrigger } =
    useModalTriggerRef();
  const { triggerRef: deletePositionTriggerRef, bindTrigger: bindDeletePositionTrigger } =
    useModalTriggerRef();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PositionRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const positionsQueryArg: PositionsListQueryParams =
    normalizePositionsListParams({
      page,
      search: searchQuery,
    });

  const {
    data: positionsResult,
    isLoading,
    isFetching,
  } = useGetPositionsQuery(positionsQueryArg);
  const [deletePositionMutation, { isLoading: deletingPosition }] =
    useDeletePositionMutation();

  const positions =
    positionsResult?.positions ?? initialData?.positions ?? [];
  const meta = positionsResult?.meta ?? initialData?.meta;

  const deleteTarget = deleteId
    ? positions.find((item) => item.id === deleteId) ?? null
    : null;

  const openEdit = (
    position: PositionRecord,
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    bindEditPositionTrigger(event);
    setEditing(position);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteId) {
      return;
    }

    await deletePositionMutation({ positionId: deleteId }).unwrap();
    setDeleteId(null);
  };

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setPage(1);
  };

  const isInitialQuery = page === 1 && searchQuery.trim().length === 0;
  const hasSeededInitialData = Boolean(initialData?.positions?.length);
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xs">
            <SearchInput
              onSearch={handleSearch}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <h2 className="text-sm font-semibold text-ink">
              {t("resultsTitle", { count: meta?.total ?? positions.length })}
            </h2>
            <MainButton
              ref={createPositionTriggerRef}
              variant="primary"
              size="sm"
              startIcon={<Plus className="size-4" />}
              onClick={() => setCreating(true)}
            >
              {t("create")}
            </MainButton>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="w-full px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.name")}
                  </th>
                  <th className="px-4 py-4 text-end text-xs font-semibold text-text-muted">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isTableLoading ? (
                  <TableSkeleton columnCount={2} />
                ) : positions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {searchQuery.trim() ? t("noResults") : t("empty")}
                    </td>
                  </tr>
                ) : (
                  positions.map((position) => (
                    <tr
                      key={position.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 text-start font-medium text-ink">
                        {position.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <MainButton
                            variant="edit-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("edit")}
                            startIcon={<Pencil className="size-4" />}
                            onClick={(event) => openEdit(position, event)}
                          />
                          <MainButton
                            variant="delete-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("delete")}
                            startIcon={<Trash2 className="size-4" />}
                            onClick={(event) => {
                              bindDeletePositionTrigger(event);
                              setDeleteId(position.id);
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

      <CreatePositionModal
        open={creating}
        onClose={() => setCreating(false)}
        triggerRef={createPositionTriggerRef}
      />

      {editing ? (
        <EditPositionModal
          position={editing}
          open={editing !== null}
          onClose={() => setEditing(null)}
          triggerRef={editPositionTriggerRef}
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
        loading={deletingPosition}
        triggerRef={deletePositionTriggerRef}
      />
    </div>
  );
}
