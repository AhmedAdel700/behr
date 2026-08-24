"use client";

import { useEffect, useMemo, type ReactElement, type RefObject } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Briefcase, Building2, Fingerprint, MapPinned } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_BRANCHES_LIST_PARAMS,
  useGetBranchesQuery,
} from "@/app/store/api/branches/branchesApi";
import {
  normalizeDepartmentsListParams,
  useGetDepartmentsQuery,
} from "@/app/store/api/departments/departmentsApi";
import { useUpdateEmployeeMutation } from "@/app/store/api/employees/employeesApi";
import { useGetAllPositionsQuery } from "@/app/store/api/positions/positionsApi";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import {
  toEmployeePayload,
  updateEmployeeAssignmentSchema,
  type UpdateEmployeeAssignmentFormValues,
} from "@/schemas/admin/employee.schema";
import type { EmployeeRecord } from "@/types/EmployeesApiTypes";

interface EditEmployeeAssignmentModalProps {
  employee: EmployeeRecord;
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function EditEmployeeAssignmentModal({
  employee,
  open,
  onClose,
  triggerRef,
}: EditEmployeeAssignmentModalProps): ReactElement | null {
  const t = useTranslations("admin.employees");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
    >
      <EditEmployeeAssignmentForm
        employee={employee}
        open={open}
        onClose={onClose}
      />
    </ModalShell>
  );
}

interface EditEmployeeAssignmentFormProps {
  employee: EmployeeRecord;
  open: boolean;
  onClose: () => void;
}

function EditEmployeeAssignmentForm({
  employee,
  open,
  onClose,
}: EditEmployeeAssignmentFormProps): ReactElement {
  const t = useTranslations("admin.employees");
  const closeModal = useGenieModalClose(onClose);
  const [updateEmployeeMutation, { isLoading: submitting }] =
    useUpdateEmployeeMutation();

  const schema = useMemo(
    () =>
      updateEmployeeAssignmentSchema({
        branchRequired: t("errors.branchRequired"),
        departmentRequired: t("errors.departmentRequired"),
        positionRequired: t("errors.positionRequired"),
        fingerprintRequired: t("errors.fingerprintRequired"),
        fingerprintInvalid: t("errors.fingerprintInvalid"),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<UpdateEmployeeAssignmentFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: toFormValues(employee),
  });

  useEffect(() => {
    if (!open) return;
    reset(toFormValues(employee));
  }, [open, employee, reset]);

  const selectedBranchId = watch("branchId");
  const { data: branchesResult } = useGetBranchesQuery(
    DEFAULT_BRANCHES_LIST_PARAMS,
    { skip: !open },
  );
  const { data: departmentsResult } = useGetDepartmentsQuery(
    normalizeDepartmentsListParams({
      page: 1,
      branch_id: selectedBranchId || undefined,
    }),
    { skip: !open || !selectedBranchId },
  );
  const { data: positions = [] } = useGetAllPositionsQuery(undefined, {
    skip: !open,
  });

  const branches = branchesResult?.branches ?? [];
  const departments = departmentsResult?.departments ?? [];

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

  const positionOptions = useMemo(() => {
    const options = positions.map((position) => ({
      value: position.id,
      label: position.name,
    }));
    const currentPosition = employee.jobPosition;

    if (
      currentPosition &&
      !options.some((option) => option.value === currentPosition.id)
    ) {
      options.unshift({
        value: currentPosition.id,
        label: currentPosition.name,
      });
    }

    return options;
  }, [employee.jobPosition, positions]);

  const handleBranchChange = (): void => {
    setValue("departmentId", "", { shouldValidate: isSubmitted });
  };

  const onSubmit = async (
    values: UpdateEmployeeAssignmentFormValues,
  ): Promise<void> => {
    try {
      await updateEmployeeMutation({
        employeeId: employee.id,
        body: toEmployeePayload(values),
      }).unwrap();
      toast.success(t("updateSuccess"));
      closeModal();
    } catch (error) {
      toast.error(getEmployeeMutationError(error, t("errors.failed")));
    }
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{t("editTitle")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("editSubtitle")}</p>

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
                handleBranchChange();
              }}
              onBlur={field.onBlur}
              error={isSubmitted ? errors.branchId?.message : undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <MainSelect
              label={t("fields.department")}
              startIcon={<Building2 />}
              placeholder={t("placeholders.department")}
              options={departmentOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={!selectedBranchId}
              error={isSubmitted ? errors.departmentId?.message : undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="jobPositionId"
          render={({ field }) => (
            <MainSelect
              label={t("fields.position")}
              startIcon={<Briefcase />}
              placeholder={t("placeholders.position")}
              options={positionOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={isSubmitted ? errors.jobPositionId?.message : undefined}
            />
          )}
        />

        <MainInput
          label={t("fields.fingerprintNumber")}
          startIcon={<Fingerprint />}
          maxLength={20}
          autoComplete="off"
          error={isSubmitted ? errors.fingerprintNumber?.message : undefined}
          {...register("fingerprintNumber")}
          placeholder={t("placeholders.fingerprintNumber")}
        />

        <ModalFormActions
          cancelLabel={t("cancel")}
          onCancel={closeModal}
          submitLabel={t("save")}
          loading={submitting}
        />
      </form>
    </>
  );
}

function toFormValues(
  employee: EmployeeRecord,
): UpdateEmployeeAssignmentFormValues {
  return {
    branchId: employee.branch?.id ?? "",
    departmentId: employee.department?.id ?? "",
    jobPositionId: employee.jobPosition?.id ?? "",
    fingerprintNumber: employee.fingerprintNumber,
  };
}

function getEmployeeMutationError(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "string" &&
    error.error.trim()
  ) {
    return error.error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
