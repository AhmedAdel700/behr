"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type Dispatch, type MouseEvent, type ReactElement, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import {
  branchesApi,
  useDeleteBranchMutation,
  useGetBranchesQuery,
  useUpdateBranchMutation,
} from "@/app/store/api/branches/branchesApi";
import type { AppDispatch } from "@/app/store/store";
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
  getBranchesSnapshot,
  removeBranchRecord,
  setBranches,
  subscribeOrg,
  upsertBranchRecord,
} from "@/lib/admin/adminOrgStore";
import { searchBranchRows } from "@/lib/admin/searchBranchRows";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";
import type { BranchPayload } from "@/types/BranchesApiTypes";

interface BranchTableRow {
  branch: AdminBranchRecord;
  departmentCount: number;
  employeeCount: number;
}

export function AdminBranchesPage({
  initialBranches,
}: {
  initialBranches?: AdminBranchRecord[];
}): ReactElement {
  const t = useTranslations("admin.branchesPage");
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  if (initialBranches?.length && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      branchesApi.util.upsertQueryData("getBranches", undefined, initialBranches),
    );
  }

  const { data: branchesData, isLoading, isFetching } = useGetBranchesQuery();

  useLayoutEffect(() => {
    if (!initialBranches?.length) {
      return;
    }

    setBranches(initialBranches);
  }, [initialBranches]);

  useEffect(() => {
    if (!branchesData) {
      return;
    }

    setBranches(branchesData);
  }, [branchesData]);

  useSyncExternalStore(subscribeEmployees, getEmployeesSnapshot, getEmployeesSnapshot);
  useSyncExternalStore(subscribeOrg, getBranchesSnapshot, getBranchesSnapshot);

  const resolvedBranches =
    branchesData ?? initialBranches ?? getBranchesSnapshot();

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
  const [savingEdit, setSavingEdit] = useState(false);
  const [updateBranchMutation] = useUpdateBranchMutation();
  const [deleteBranchMutation, { isLoading: deletingBranch }] =
    useDeleteBranchMutation();

  const overviews = buildBranchOverviews(getEmployeesSnapshot());
  const branchRows: BranchTableRow[] = resolvedBranches.map((branch) => {
    const overview = overviews.find((item) => item.branch === branch.slug);
    return {
      branch,
      departmentCount:
        branch.departmentsCount ?? overview?.departments.length ?? 0,
      employeeCount: branch.usersCount ?? overview?.employeeCount ?? 0,
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
    setDraft(branchToDraft(branch));
  };

  const saveEdit = async (): Promise<boolean> => {
    if (!editing?.id.trim()) {
      toast.error(t("updateError"));
      return false;
    }

    setSavingEdit(true);

    const body: BranchPayload = {
      name: draft.name.trim(),
      city: draft.city.trim(),
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      latitude: draft.latitude,
      longitude: draft.longitude,
    };

    try {
      const branch = await updateBranchMutation({
        branchId: editing.id.trim(),
        body,
      }).unwrap();

      upsertBranchRecord(branch);
      toast.success(t("updateSuccess"));
      setDraft(emptyDraft());
      return true;
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("updateError")));
      return false;
    } finally {
      setSavingEdit(false);
    }
  };

  const closeEdit = (): void => {
    setEditing(null);
    setDraft(emptyDraft());
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteId) {
      return;
    }

    try {
      await deleteBranchMutation({ branchId: deleteId }).unwrap();
      removeBranchRecord(deleteId);
      toast.success(t("deleteSuccess"));
      setDeleteId(null);
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("deleteError")));
    }
  };

  const isTableLoading =
    (isLoading || isFetching) && resolvedBranches.length === 0;

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
                {isTableLoading ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className="px-4 py-10 text-center text-sm text-text-muted"
                    >
                      {t("loading")}
                    </td>
                  </tr>
                ) : filteredBranchRows.length === 0 ? (
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
            saving={savingEdit}
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
        onConfirm={() => {
          void handleDelete();
          return false;
        }}
        loading={deletingBranch}
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
  onSave: () => Promise<boolean>;
  saving: boolean;
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
  saving,
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
    void (async (): Promise<void> => {
      const saved = await onSave();
      if (saved) {
        closeModal();
      }
    })();
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
        loading={saving}
        cancelDisabled={saving}
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

function branchToDraft(branch: AdminBranchRecord): UpdateBranchDraft {
  return {
    name: branch.name ?? "",
    city: branch.city ?? "",
    address: branch.address ?? "",
    phone: branch.phone ?? "",
    email: branch.email ?? "",
    latitude: branch.latitude ?? DEFAULT_BRANCH_LOCATION.latitude,
    longitude: branch.longitude ?? DEFAULT_BRANCH_LOCATION.longitude,
  };
}

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const value = (error as { error: unknown }).error;
    if (typeof value === "string") {
      return value;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
