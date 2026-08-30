"use client";

import {
  useEffect,
  useMemo,
  type ReactElement,
  type RefObject,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Building2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import {
  useGetAllDepartmentsQuery,
} from "@/app/store/api/departments/departmentsApi";
import {
  useAssignLeaveBalancesByBranchMutation,
  useAssignLeaveBalancesByDepartmentMutation,
} from "@/app/store/api/leave-balances/leaveBalancesApi";
import { getLeaveTypeMutationError } from "@/components/admin/LeaveTypeFormFields";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { MainSelect } from "@/components/shared/MainSelect";
import {
  createAssignByBranchSchema,
  createAssignByDepartmentSchema,
  emptyAssignLeaveBalancesFormValues,
  type AssignLeaveBalancesFormValues,
} from "@/schemas/admin/leave-balance-assign.schema";

export type AssignLeaveBalancesMode = "branch" | "department";

interface AssignLeaveBalancesModalProps {
  open: boolean;
  mode: AssignLeaveBalancesMode;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function AssignLeaveBalancesModal({
  open,
  mode,
  onClose,
  triggerRef,
}: AssignLeaveBalancesModalProps): ReactElement | null {
  const t = useTranslations("admin.leaveTypesPage.assign");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
      panelClassName="overflow-visible"
    >
      <AssignLeaveBalancesForm open={open} mode={mode} onClose={onClose} />
    </ModalShell>
  );
}

interface AssignLeaveBalancesFormProps {
  open: boolean;
  mode: AssignLeaveBalancesMode;
  onClose: () => void;
}

function AssignLeaveBalancesForm({
  open,
  mode,
  onClose,
}: AssignLeaveBalancesFormProps): ReactElement {
  const t = useTranslations("admin.leaveTypesPage.assign");
  const closeModal = useGenieModalClose(onClose);
  const {
    data: branches = [],
    isLoading: branchesLoading,
    isError,
  } = useGetAllBranchesQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });
  const [assignByBranch, { isLoading: assigningByBranch }] =
    useAssignLeaveBalancesByBranchMutation();
  const [assignByDepartment, { isLoading: assigningByDepartment }] =
    useAssignLeaveBalancesByDepartmentMutation();

  const schema = useMemo(
    () =>
      mode === "department"
        ? createAssignByDepartmentSchema({
            branchRequired: t("errors.branchRequired"),
            departmentRequired: t("errors.departmentRequired"),
          })
        : createAssignByBranchSchema({
            branchRequired: t("errors.branchRequired"),
          }),
    [mode, t],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<AssignLeaveBalancesFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: emptyAssignLeaveBalancesFormValues(),
  });

  const selectedBranchId = watch("branchId");
  const selectedDepartmentId = watch("departmentId");
  const {
    data: departments = [],
    isFetching: loadingDepartments,
  } = useGetAllDepartmentsQuery(selectedBranchId || undefined, {
    skip: mode !== "department" || !open || !selectedBranchId,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    reset(emptyAssignLeaveBalancesFormValues());
  }, [open, mode, reset]);

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: branch.city ? `${branch.name} · ${branch.city}` : branch.name,
      })),
    [branches],
  );

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        value: department.id,
        label: department.name,
      })),
    [departments],
  );

  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchId,
  );
  const selectedDepartment = departments.find(
    (department) => department.id === selectedDepartmentId,
  );

  const submitting = assigningByBranch || assigningByDepartment;
  const canConfirm =
    mode === "branch"
      ? Boolean(selectedBranchId)
      : Boolean(selectedBranchId && selectedDepartmentId);

  const onSubmit = async (
    values: AssignLeaveBalancesFormValues,
  ): Promise<void> => {
    const branchId = Number(values.branchId);
    if (!Number.isFinite(branchId)) {
      return;
    }

    try {
      if (mode === "branch") {
        const result = await assignByBranch({
          branch_id: branchId,
        }).unwrap();
        toast.success(result.message || t("branchSuccess"));
      } else {
        const departmentId = Number(values.departmentId);
        if (!Number.isFinite(departmentId)) {
          return;
        }

        const result = await assignByDepartment({
          branch_id: branchId,
          department_id: departmentId,
        }).unwrap();
        toast.success(result.message || t("departmentSuccess"));
      }

      closeModal();
    } catch (error) {
      toast.error(getLeaveTypeMutationError(error, t("errors.failed")));
    }
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">
        {mode === "branch" ? t("branchTitle") : t("departmentTitle")}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        {mode === "branch" ? t("branchSubtitle") : t("departmentSubtitle")}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-3"
        noValidate
      >
        {isError ? (
          <p className="text-xs text-danger-600">{t("errors.failed")}</p>
        ) : null}

        <Controller
          control={control}
          name="branchId"
          render={({ field }) => (
            <MainSelect
              key={`branch-${branchOptions.map((option) => option.value).join("-") || "empty"}`}
              label={t("fields.branch")}
              startIcon={<MapPinned />}
              placeholder={
                branchesLoading ? t("loading") : t("placeholders.branch")
              }
              options={branchOptions}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                setValue("departmentId", "", { shouldValidate: false });
              }}
              onBlur={field.onBlur}
              disabled={submitting}
              required
              error={isSubmitted ? errors.branchId?.message : undefined}
            />
          )}
        />

        {mode === "department" ? (
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <MainSelect
                key={`dept-${departmentOptions.map((option) => option.value).join("-") || "empty"}`}
                label={t("fields.department")}
                startIcon={<Building2 />}
                placeholder={
                  !selectedBranchId
                    ? t("placeholders.department")
                    : loadingDepartments
                      ? t("loading")
                      : departmentOptions.length === 0
                        ? t("noDepartments")
                        : t("placeholders.department")
                }
                options={departmentOptions}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={!selectedBranchId || submitting}
                required
                error={isSubmitted ? errors.departmentId?.message : undefined}
              />
            )}
          />
        ) : null}

        {selectedBranch ? (
          <p className="text-xs text-text-muted">
            {mode === "department" && selectedDepartment
              ? t("previewDepartment", {
                  branch: selectedBranch.name,
                  department: selectedDepartment.name,
                })
              : t("previewBranch", { branch: selectedBranch.name })}
          </p>
        ) : null}

        <ModalFormActions
          cancelLabel={t("cancel")}
          onCancel={closeModal}
          submitLabel={t("submit")}
          loading={submitting}
          submitDisabled={!canConfirm}
        />
      </form>
    </>
  );
}
