"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type Dispatch, type MouseEvent, type ReactElement, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { CreateBranchModal } from "@/components/admin/CreateBranchModal";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { BranchMapPicker } from "@/components/shared/BranchMapPicker";
import { MainButton } from "@/components/shared/MainButton";
import { ModalShell } from "@/components/shared/ModalShell";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { MainInput } from "@/components/shared/MainInput";
import { DEFAULT_BRANCH_LOCATION } from "@/lib/admin/branchLocations";
import { buildBranchOverviews } from "@/lib/admin/buildBranchOverviews";
import { useModalTriggerRef } from "@/lib/useModalTriggerRef";
import {
  getEmployeesSnapshot,
  subscribeEmployees,
} from "@/lib/admin/adminDataStore";
import {
  deleteBranch,
  getBranchesSnapshot,
  subscribeOrg,
  updateBranch,
} from "@/lib/admin/adminOrgStore";
import { searchBranchRows } from "@/lib/admin/searchBranchRows";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";

interface BranchTableRow {
  branch: AdminBranchRecord;
  departmentCount: number;
  employeeCount: number;
}

export function AdminBranchesPage(): ReactElement {
  const t = useTranslations("admin.branchesPage");
  const router = useRouter();

  useSyncExternalStore(subscribeEmployees, getEmployeesSnapshot, getEmployeesSnapshot);
  useSyncExternalStore(subscribeOrg, getBranchesSnapshot, getBranchesSnapshot);

  const createBranchTriggerRef = useRef<HTMLButtonElement>(null);
  const { triggerRef: editBranchTriggerRef, bindTrigger: bindEditBranchTrigger } =
    useModalTriggerRef();
  const { triggerRef: deleteBranchTriggerRef, bindTrigger: bindDeleteBranchTrigger } =
    useModalTriggerRef();
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState<AdminBranchRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<UpdateBranchDraft>(emptyDraft());

  const overviews = buildBranchOverviews(getEmployeesSnapshot());
  const branchRows: BranchTableRow[] = getBranchesSnapshot().map((branch) => {
    const overview = overviews.find((item) => item.branch === branch.slug);
    return {
      branch,
      departmentCount: overview?.departments.length ?? 0,
      employeeCount: overview?.employeeCount ?? 0,
    };
  });

  const filteredBranchRows = useMemo(
    () => searchBranchRows(branchRows, searchQuery),
    [branchRows, searchQuery]
  );

  const deleteTarget = deleteId
    ? branchRows.find((row) => row.branch.id === deleteId)?.branch ?? null
    : null;

  const openEdit = (
    branch: AdminBranchRecord,
    event: MouseEvent<HTMLButtonElement>,
  ): void => {
    bindEditBranchTrigger(event);
    setEditing(branch);
    setDraft({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      latitude: branch.latitude,
      longitude: branch.longitude,
    });
  };

  const saveEdit = (): void => {
    if (!editing) return;
    updateBranch(editing.id, draft);
    setDraft(emptyDraft());
  };

  const closeEdit = (): void => {
    setEditing(null);
    setDraft(emptyDraft());
  };

  const confirmDelete = (): boolean => {
    if (!deleteId) return false;
    const result = deleteBranch(deleteId);
    if (!result.success) return false;
    return true;
  };

  const columnCount = 6;

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
            <MainInput
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              startIcon={<Search />}
              aria-label={t("searchPlaceholder")}
            />
          </div>
          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <h2 className="text-sm font-semibold text-ink">
              {t("branchesTitle", { count: filteredBranchRows.length })}
            </h2>
            <MainButton
              ref={createBranchTriggerRef}
              variant="primary"
              size="sm"
              startIcon={<Plus className="size-4" />}
              onClick={() => setCreating(true)}
            >
              {t("createBranch")}
            </MainButton>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs">
          <div className="admin-scroll-visible overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/60">
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.branch")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.city")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.contact")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.departments")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.employees")}
                  </th>
                  <th className="px-4 py-4 text-start text-xs font-semibold text-text-muted">
                    {t("columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBranchRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {branchRows.length === 0
                        ? t("emptyBranches")
                        : t("emptySearch")}
                    </td>
                  </tr>
                ) : (
                  filteredBranchRows.map(({ branch, departmentCount, employeeCount }) => (
                    <tr
                      key={branch.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3 text-start font-medium text-ink">
                        {branch.name}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {branch.city}
                      </td>
                      <td className="px-4 py-3 text-start">
                        <p className="text-ink">{branch.email}</p>
                        <p className="text-xs text-text-muted">{branch.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {departmentCount}
                      </td>
                      <td className="px-4 py-3 text-start text-text-secondary">
                        {employeeCount}
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
                                `/admin-dashboard/branches/${branch.id}`
                              )
                            }
                          />
                          <MainButton
                            variant="edit-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("edit")}
                            startIcon={<Pencil className="size-4" />}
                            onClick={(event) => openEdit(branch, event)}
                          />
                          <MainButton
                            variant="delete-soft"
                            size="sm"
                            iconOnly
                            aria-label={t("delete")}
                            startIcon={<Trash2 className="size-4" />}
                            onClick={(event) => {
                              bindDeleteBranchTrigger(event);
                              setDeleteId(branch.id);
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
        </div>
      </section>

      {editing ? (
        <ModalShell
          open={editing !== null}
          onClose={closeEdit}
          triggerRef={editBranchTriggerRef}
          backdropAriaLabel={t("cancel")}
          panelClassName="max-w-xl"
        >
          <EditBranchDialog
            draft={draft}
            setDraft={setDraft}
            onSave={saveEdit}
            onClose={closeEdit}
            cancelLabel={t("cancel")}
            saveLabel={t("save")}
            title={t("editTitle")}
            locationLabel={t("fields.location")}
            locationHint={t("locationHint")}
            findingAddressLabel={t("findingAddress")}
            searchPlaceholder={t("searchPlaceholder")}
            searchingLabel={t("searching")}
            searchNoResultsLabel={t("searchNoResults")}
            fieldLabels={{
              name: t("fields.name"),
              city: t("fields.city"),
              phone: t("fields.phone"),
              email: t("fields.email"),
            }}
          />
        </ModalShell>
      ) : null}

      <CreateBranchModal
        open={creating}
        onClose={() => setCreating(false)}
        triggerRef={createBranchTriggerRef}
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
        onConfirm={confirmDelete}
        triggerRef={deleteBranchTriggerRef}
      />
    </div>
  );
}

interface UpdateBranchDraft {
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
}

interface EditBranchDialogProps {
  draft: UpdateBranchDraft;
  setDraft: Dispatch<SetStateAction<UpdateBranchDraft>>;
  onSave: () => void;
  onClose: () => void;
  title: string;
  cancelLabel: string;
  saveLabel: string;
  locationLabel: string;
  locationHint: string;
  findingAddressLabel: string;
  searchPlaceholder: string;
  searchingLabel: string;
  searchNoResultsLabel: string;
  fieldLabels: {
    name: string;
    city: string;
    phone: string;
    email: string;
  };
}

function EditBranchDialog({
  draft,
  setDraft,
  onSave,
  onClose,
  title,
  cancelLabel,
  saveLabel,
  locationLabel,
  locationHint,
  findingAddressLabel,
  searchPlaceholder,
  searchingLabel,
  searchNoResultsLabel,
  fieldLabels,
}: EditBranchDialogProps): ReactElement {
  const closeModal = useGenieModalClose(onClose);

  const handleSave = (): void => {
    onSave();
    closeModal();
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MainInput
            label={fieldLabels.name}
            value={draft.name}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <MainInput
            label={fieldLabels.city}
            value={draft.city}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, city: event.target.value }))
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MainInput
            label={fieldLabels.phone}
            type="tel"
            value={draft.phone}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, phone: event.target.value }))
            }
          />
          <MainInput
            label={fieldLabels.email}
            type="email"
            value={draft.email}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, email: event.target.value }))
            }
          />
        </div>
        <BranchMapPicker
          active
          label={locationLabel}
          hint={locationHint}
          findingAddressLabel={findingAddressLabel}
          searchPlaceholder={searchPlaceholder}
          searchingLabel={searchingLabel}
          searchNoResultsLabel={searchNoResultsLabel}
          title={
            [draft.name.trim(), draft.city.trim()].filter(Boolean).join(" · ") ||
            undefined
          }
          value={{
            latitude: draft.latitude,
            longitude: draft.longitude,
          }}
          onChange={(location) =>
            setDraft((prev) => ({
              ...prev,
              latitude: location.latitude,
              longitude: location.longitude,
            }))
          }
          onPlaceSelect={(place) =>
            setDraft((prev) => ({
              ...prev,
              latitude: place.location.latitude,
              longitude: place.location.longitude,
            }))
          }
          onResolvedAddress={(nextAddress) =>
            setDraft((prev) => ({ ...prev, address: nextAddress }))
          }
        />
      </div>
      <ModalFormActions
        className="mt-4 pt-0"
        cancelLabel={cancelLabel}
        onCancel={closeModal}
        submitLabel={saveLabel}
        submitType="button"
        onSubmit={handleSave}
      />
    </>
  );
}

function emptyDraft(): UpdateBranchDraft {
  return {
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    latitude: DEFAULT_BRANCH_LOCATION.latitude,
    longitude: DEFAULT_BRANCH_LOCATION.longitude,
  };
}
