"use client";

import { useEffect, useMemo, type ReactElement, type RefObject } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Building2,
  Fingerprint,
  Lock,
  Mail,
  MapPinned,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useGetAllBranchesQuery } from "@/app/store/api/branches/branchesApi";
import { useGetAllDepartmentsQuery } from "@/app/store/api/departments/departmentsApi";
import { useCreateEmployeeMutation } from "@/app/store/api/employees/employeesApi";
import { useGetAllPositionsQuery } from "@/app/store/api/positions/positionsApi";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import { applyCreateEmployeeMutationErrors } from "@/lib/admin/employeeMutationErrors";
import {
  createEmployeeSchema,
  emptyCreateEmployeeFormValues,
  toCreateEmployeePayload,
  type CreateEmployeeFormValues,
} from "@/schemas/admin/employee.schema";

interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function CreateEmployeeModal({
  open,
  onClose,
  triggerRef,
}: CreateEmployeeModalProps): ReactElement | null {
  const t = useTranslations("admin.employees");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
      panelClassName="max-w-2xl"
    >
      <CreateEmployeeForm open={open} onClose={onClose} />
    </ModalShell>
  );
}

interface CreateEmployeeFormProps {
  open: boolean;
  onClose: () => void;
}

function CreateEmployeeForm({
  open,
  onClose,
}: CreateEmployeeFormProps): ReactElement {
  const t = useTranslations("admin.employees");
  const closeModal = useGenieModalClose(onClose);
  const [createEmployeeMutation, { isLoading: submitting }] =
    useCreateEmployeeMutation();

  const schema = useMemo(
    () =>
      createEmployeeSchema({
        nameRequired: t("errors.nameRequired"),
        nameMin: t("errors.nameMin"),
        emailRequired: t("errors.emailRequired"),
        emailInvalid: t("errors.emailInvalid"),
        phoneRequired: t("errors.phoneRequired"),
        phoneInvalid: t("errors.phoneInvalid"),
        fingerprintRequired: t("errors.fingerprintRequired"),
        fingerprintInvalid: t("errors.fingerprintInvalid"),
        branchRequired: t("errors.branchRequired"),
        departmentRequired: t("errors.departmentRequired"),
        positionRequired: t("errors.positionRequired"),
        passwordRequired: t("errors.passwordRequired"),
        passwordMin: t("errors.passwordMin"),
        confirmPasswordRequired: t("errors.confirmPasswordRequired"),
        passwordMismatch: t("errors.passwordMismatch"),
        avatarInvalidType: t("errors.avatarInvalidType"),
        avatarTooLarge: t("errors.avatarTooLarge"),
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
    reset,
    formState: { errors, isSubmitted },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: emptyCreateEmployeeFormValues(),
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    reset(emptyCreateEmployeeFormValues());
  }, [open, reset]);

  const selectedBranchId = watch("branchId");
  const {
    data: branches = [],
    isLoading: branchesLoading,
  } = useGetAllBranchesQuery(undefined, { skip: !open });
  const { data: departments = [] } = useGetAllDepartmentsQuery(
    selectedBranchId || undefined,
    { skip: !open || !selectedBranchId },
  );
  const { data: positions = [] } = useGetAllPositionsQuery(undefined, {
    skip: !open,
  });

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

  const positionOptions = useMemo(
    () =>
      positions.map((position) => ({
        value: position.id,
        label: position.name,
      })),
    [positions],
  );

  const onSubmit = async (values: CreateEmployeeFormValues): Promise<void> => {
    try {
      const result = await createEmployeeMutation({
        body: toCreateEmployeePayload(values),
      }).unwrap();
      toast.success(result.message || t("createSuccess"));
      closeModal();
    } catch (error) {
      const message = applyCreateEmployeeMutationErrors(
        error,
        setError,
        t("errors.createFailed"),
      );
      toast.error(message);
    }
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{t("createTitle")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("createSubtitle")}</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-3"
        noValidate
      >
        <Controller
          control={control}
          name="avatar"
          render={({ field }) => (
            <AvatarUpload
              label={t("fields.avatar")}
              hint={t("avatarHint")}
              optionalLabel={t("avatarOptional")}
              uploadLabel={t("avatarUpload")}
              changeLabel={t("avatarChange")}
              removeLabel={t("avatarRemove")}
              optional
              value={field.value}
              error={isSubmitted ? errors.avatar?.message : undefined}
              onChange={field.onChange}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 *:min-w-0">
          <MainInput
            label={t("fields.name")}
            startIcon={<User />}
            autoComplete="name"
            error={isSubmitted ? errors.name?.message : undefined}
            {...register("name")}
            placeholder={t("placeholders.name")}
          />

          <MainInput
            label={t("fields.email")}
            type="email"
            startIcon={<Mail />}
            autoComplete="email"
            error={isSubmitted ? errors.email?.message : undefined}
            {...register("email")}
            placeholder={t("placeholders.email")}
          />

          <MainInput
            label={t("fields.phone")}
            type="tel"
            startIcon={<Phone />}
            autoComplete="tel"
            error={isSubmitted ? errors.phone?.message : undefined}
            {...register("phone")}
            placeholder={t("placeholders.phone")}
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

          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <MainSelect
                key={`branch-${branchOptions.map((option) => option.value).join("-") || "empty"}`}
                label={t("fields.branch")}
                startIcon={<MapPinned />}
                placeholder={
                  branchesLoading
                    ? t("placeholders.loadingBranches")
                    : t("placeholders.branch")
                }
                options={branchOptions}
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("departmentId", "", { shouldValidate: isSubmitted });
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
                key={`department-${selectedBranchId}-${departmentOptions.map((option) => option.value).join("-") || "empty"}`}
                label={t("fields.department")}
                startIcon={<Building2 />}
                placeholder={
                  selectedBranchId
                    ? t("placeholders.department")
                    : t("placeholders.departmentNeedsBranch")
                }
                options={departmentOptions}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={!selectedBranchId}
                error={isSubmitted ? errors.departmentId?.message : undefined}
              />
            )}
          />

          <div className="sm:col-span-2">
            <Controller
              control={control}
              name="jobPositionId"
              render={({ field }) => (
                <MainSelect
                  key={`position-${positionOptions.map((option) => option.value).join("-") || "empty"}`}
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
          </div>

          <MainInput
            label={t("fields.password")}
            type="password"
            startIcon={<Lock />}
            autoComplete="new-password"
            error={isSubmitted ? errors.password?.message : undefined}
            {...register("password")}
            placeholder={t("placeholders.password")}
          />

          <MainInput
            label={t("fields.confirmPassword")}
            type="password"
            startIcon={<Lock />}
            autoComplete="new-password"
            error={isSubmitted ? errors.confirmPassword?.message : undefined}
            {...register("confirmPassword")}
            placeholder={t("placeholders.confirmPassword")}
          />
        </div>

        <ModalFormActions
          cancelLabel={t("cancel")}
          onCancel={closeModal}
          submitLabel={t("createSubmit")}
          loading={submitting}
        />
      </form>
    </>
  );
}
