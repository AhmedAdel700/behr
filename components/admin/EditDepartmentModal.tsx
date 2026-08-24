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
  DEFAULT_BRANCHES_LIST_PARAMS,
  useGetBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import { useUpdateDepartmentMutation } from "@/app/store/api/departments/departmentsApi";
import { EmployeeManagerPicker } from "@/components/admin/EmployeeManagerPicker";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import {
  updateDepartmentSchema,
  type UpdateDepartmentFormValues,
} from "@/schemas/admin/org.schema";
import type {
  DepartmentPayload,
  DepartmentRecord,
} from "@/types/DepartmentsApiTypes";
import type { EmployeeManagerRecord } from "@/types/EmployeesApiTypes";

interface EditDepartmentModalProps {
  department: DepartmentRecord;
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function EditDepartmentModal({
  department,
  open,
  onClose,
  triggerRef,
}: EditDepartmentModalProps): ReactElement | null {
  const tPage = useTranslations("admin.departmentsPage");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={tPage("cancel")}
    >
      <EditDepartmentForm department={department} open={open} onClose={onClose} />
    </ModalShell>
  );
}

interface EditDepartmentFormProps {
  department: DepartmentRecord;
  open: boolean;
  onClose: () => void;
}

function EditDepartmentForm({
  department,
  open,
  onClose,
}: EditDepartmentFormProps): ReactElement {
  const t = useTranslations("admin.createDepartment");
  const tPage = useTranslations("admin.departmentsPage");
  const closeModal = useGenieModalClose(onClose);
  const [updateDepartmentMutation, { isLoading: submitting }] =
    useUpdateDepartmentMutation();
  const { data: branchesResult } = useGetBranchesQuery(DEFAULT_BRANCHES_LIST_PARAMS);
  const branches = branchesResult?.branches ?? [];

  const schema = useMemo(
    () =>
      updateDepartmentSchema({
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
  } = useForm<UpdateDepartmentFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: toFormValues(department),
  });

  useEffect(() => {
    if (!open) return;
    reset(toFormValues(department));
  }, [open, department, reset]);

  const selectedBranchId = watch("branchId");

  const initialSelectedManager = useMemo((): EmployeeManagerRecord | null => {
    if (!department.managerUserId) {
      return null;
    }

    return {
      id: department.managerUserId,
      name: department.managerName,
      email: department.managerEmail,
      position: "",
      branchId: department.branchId,
    };
  }, [
    department.branchId,
    department.managerEmail,
    department.managerName,
    department.managerUserId,
  ]);

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

  const onSubmit = async (values: UpdateDepartmentFormValues): Promise<void> => {
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
      await updateDepartmentMutation({
        departmentId: department.id,
        body,
      }).unwrap();
      toast.success(tPage("save"));
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.duplicate");
      setError("name", { message });
    }
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{tPage("editTitle")}</h2>

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
              initialSelectedEmployee={initialSelectedManager}
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
          cancelLabel={tPage("cancel")}
          onCancel={closeModal}
          submitLabel={tPage("save")}
          loading={submitting}
        />
      </form>
    </>
  );
}

function toFormValues(
  department: DepartmentRecord,
): UpdateDepartmentFormValues {
  return {
    branchId: department.branchId,
    name: department.name,
    managerEmployeeId: department.managerUserId,
  };
}
