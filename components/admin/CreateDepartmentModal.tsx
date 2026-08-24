"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type RefObject,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Building2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_BRANCHES_LIST_PARAMS,
  useGetBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import { useCreateDepartmentMutation } from "@/app/store/api/departments/departmentsApi";
import { EmployeeManagerPicker } from "@/components/admin/EmployeeManagerPicker";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import {
  createDepartmentSchema,
  type CreateDepartmentFormValues,
} from "@/schemas/admin/org.schema";
import type { DepartmentPayload } from "@/types/DepartmentsApiTypes";

interface CreateDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function CreateDepartmentModal({
  open,
  onClose,
  triggerRef,
}: CreateDepartmentModalProps): ReactElement | null {
  const t = useTranslations("admin.createDepartment");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
    >
      <CreateDepartmentForm open={open} onClose={onClose} />
    </ModalShell>
  );
}

interface CreateDepartmentFormProps {
  open: boolean;
  onClose: () => void;
}

function CreateDepartmentForm({
  open,
  onClose,
}: CreateDepartmentFormProps): ReactElement {
  const t = useTranslations("admin.createDepartment");
  const closeModal = useGenieModalClose(onClose);
  const [createDepartmentMutation, { isLoading: submitting }] =
    useCreateDepartmentMutation();
  const { data: branchesResult } = useGetBranchesQuery(DEFAULT_BRANCHES_LIST_PARAMS);
  const branches = branchesResult?.branches ?? [];

  const schema = useMemo(
    () =>
      createDepartmentSchema({
        branchRequired: t("errors.branchRequired"),
        nameRequired: t("errors.nameRequired"),
        nameMin: t("errors.nameMin"),
        managerRequired: t("errors.managerRequired"),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: emptyValues(),
  });

  useEffect(() => {
    if (!open) return;
    reset(emptyValues());
  }, [open, reset]);

  const selectedBranchId = watch("branchId");

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: `${branch.name} · ${branch.city}`,
      })),
    [branches],
  );

  const handleBranchChange = (value: string): void => {
    setValue("managerEmployeeId", "", { shouldValidate: false });
    clearErrors("managerEmployeeId");
    if (isSubmitted) {
      setValue("branchId", value, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: CreateDepartmentFormValues): Promise<void> => {
    const branchId = Number(values.branchId);

    if (!Number.isFinite(branchId)) {
      setError("branchId", { message: t("errors.branchRequired") });
      return;
    }
    const managerValue = values.managerEmployeeId.trim();
    const managerUserId =
      managerValue.length > 0 ? Number(managerValue) : null;

    if (managerUserId !== null && !Number.isFinite(managerUserId)) {
      setError("managerEmployeeId", { message: t("errors.managerRequired") });
      return;
    }

    const body: DepartmentPayload = {
      name: values.name.trim(),
      branch_id: branchId,
      manager_user_id: managerUserId,
    };

    try {
      await createDepartmentMutation({ body }).unwrap();
      toast.success(t("success"));
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.duplicate");
      setError("name", { message });
    }
  };

  const noBranches = branches.length === 0;

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>

      {noBranches ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-muted/30 p-4 text-center text-sm text-text-muted">
          {t("noBranches")}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 space-y-3"
          noValidate
        >
          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <MainSelect
                label={t("fields.branch")}
                startIcon={<MapPinned />}
                placeholder={t("placeholders.branch")}
                options={branchOptions}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleBranchChange(value);
                }}
                onBlur={field.onBlur}
                error={isSubmitted ? errors.branchId?.message : undefined}
              />
            )}
          />

          <MainInput
            label={t("fields.name")}
            startIcon={<Building2 />}
            error={isSubmitted ? errors.name?.message : undefined}
            {...register("name")}
            placeholder={t("placeholders.name")}
          />

          <Controller
            control={control}
            name="managerEmployeeId"
            render={({ field }) => (
              <EmployeeManagerPicker
                branchId={selectedBranchId}
                selectedEmployeeId={field.value}
                onSelect={(employeeId) => {
                  field.onChange(employeeId);
                  if (employeeId) {
                    clearErrors("managerEmployeeId");
                  }
                }}
                error={
                  isSubmitted ? errors.managerEmployeeId?.message : undefined
                }
              />
            )}
          />

          <ModalFormActions
            cancelLabel={t("cancel")}
            onCancel={closeModal}
            submitLabel={t("submit")}
            loading={submitting}
          />
        </form>
      )}
    </>
  );
}

function emptyValues(): CreateDepartmentFormValues {
  return {
    branchId: "",
    name: "",
    managerEmployeeId: "",
  };
}
