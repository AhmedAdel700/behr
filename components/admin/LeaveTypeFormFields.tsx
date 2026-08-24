"use client";

import { useMemo, type ReactElement } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import type { LeaveTypeFormValues } from "@/schemas/admin/leave-type.schema";

interface LeaveTypeFormFieldsProps {
  register: UseFormRegister<LeaveTypeFormValues>;
  control: Control<LeaveTypeFormValues>;
  watch: UseFormWatch<LeaveTypeFormValues>;
  errors: FieldErrors<LeaveTypeFormValues>;
  isSubmitted: boolean;
}

function booleanOptions(
  yesLabel: string,
  noLabel: string,
): { value: "true" | "false"; label: string }[] {
  return [
    { value: "true", label: yesLabel },
    { value: "false", label: noLabel },
  ];
}

export function LeaveTypeFormFields({
  register,
  control,
  watch,
  errors,
  isSubmitted,
}: LeaveTypeFormFieldsProps): ReactElement {
  const t = useTranslations("admin.createLeaveType");
  const canCarryForward = watch("canCarryForward") === "true";

  const unitOptions = useMemo(
    () => [
      { value: "day", label: t("options.unit.day") },
      { value: "hour", label: t("options.unit.hour") },
    ],
    [t],
  );

  const allocationTypeOptions = useMemo(
    () => [
      { value: "yearly", label: t("options.allocationType.yearly") },
      { value: "monthly", label: t("options.allocationType.monthly") },
      { value: "none", label: t("options.allocationType.none") },
    ],
    [t],
  );

  const genderOptions = useMemo(
    () => [
      { value: "none", label: t("options.gender.none") },
      { value: "female", label: t("options.gender.female") },
      { value: "male", label: t("options.gender.male") },
    ],
    [t],
  );

  const yesNoOptions = useMemo(
    () => booleanOptions(t("options.yes"), t("options.no")),
    [t],
  );

  return (
    <>
      <MainInput
        label={t("fields.name")}
        error={isSubmitted ? errors.name?.message : undefined}
        {...register("name")}
        placeholder={t("placeholders.name")}
      />

      <MainInput
        as="textarea"
        label={t("fields.description")}
        error={isSubmitted ? errors.description?.message : undefined}
        {...register("description")}
        placeholder={t("placeholders.description")}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <MainSelect
              label={t("fields.unit")}
              placeholder={t("placeholders.unit")}
              options={unitOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={isSubmitted ? errors.unit?.message : undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="allocationType"
          render={({ field }) => (
            <MainSelect
              label={t("fields.allocationType")}
              placeholder={t("placeholders.allocationType")}
              options={allocationTypeOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={isSubmitted ? errors.allocationType?.message : undefined}
            />
          )}
        />
      </div>

      <MainInput
        label={t("fields.allocationAmount")}
        type="number"
        min={0}
        inputMode="numeric"
        error={isSubmitted ? errors.allocationAmount?.message : undefined}
        {...register("allocationAmount")}
        placeholder={t("placeholders.allocationAmount")}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="canCarryForward"
          render={({ field }) => (
            <MainSelect
              label={t("fields.canCarryForward")}
              options={yesNoOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={isSubmitted ? errors.canCarryForward?.message : undefined}
            />
          )}
        />

        <MainInput
          label={t("fields.carryForwardLimit")}
          type="number"
          min={0}
          inputMode="numeric"
          disabled={!canCarryForward}
          error={isSubmitted ? errors.carryForwardLimit?.message : undefined}
          {...register("carryForwardLimit")}
          placeholder={t("placeholders.carryForwardLimit")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="isPaid"
          render={({ field }) => (
            <MainSelect
              label={t("fields.isPaid")}
              options={yesNoOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={isSubmitted ? errors.isPaid?.message : undefined}
            />
          )}
        />

        <Controller
          control={control}
          name="requiresApproval"
          render={({ field }) => (
            <MainSelect
              label={t("fields.requiresApproval")}
              options={yesNoOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={
                isSubmitted ? errors.requiresApproval?.message : undefined
              }
            />
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="genderRestriction"
          render={({ field }) => (
            <MainSelect
              label={t("fields.genderRestriction")}
              options={genderOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={
                isSubmitted ? errors.genderRestriction?.message : undefined
              }
            />
          )}
        />

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <MainSelect
              label={t("fields.isActive")}
              options={yesNoOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={isSubmitted ? errors.isActive?.message : undefined}
            />
          )}
        />
      </div>
    </>
  );
}

export function getLeaveTypeMutationError(
  error: unknown,
  fallback: string,
): string {
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
