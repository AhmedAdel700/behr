"use client";

import { useEffect, useMemo, type ReactElement, type RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useUpdateLeaveTypeMutation } from "@/app/store/api/leave-types/leaveTypesApi";
import {
  getLeaveTypeMutationError,
  LeaveTypeFormFields,
} from "@/components/admin/LeaveTypeFormFields";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import {
  createLeaveTypeSchema,
  toLeaveTypePayload,
  type LeaveTypeFormValues,
} from "@/schemas/admin/leave-type.schema";
import type { LeaveTypeRecord } from "@/types/LeaveTypesApiTypes";

interface EditLeaveTypeModalProps {
  leaveType: LeaveTypeRecord;
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function EditLeaveTypeModal({
  leaveType,
  open,
  onClose,
  triggerRef,
}: EditLeaveTypeModalProps): ReactElement | null {
  const tPage = useTranslations("admin.leaveTypesPage");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={tPage("cancel")}
    >
      <EditLeaveTypeForm leaveType={leaveType} open={open} onClose={onClose} />
    </ModalShell>
  );
}

interface EditLeaveTypeFormProps {
  leaveType: LeaveTypeRecord;
  open: boolean;
  onClose: () => void;
}

function toFormValues(leaveType: LeaveTypeRecord): LeaveTypeFormValues {
  return {
    name: leaveType.name,
    description: leaveType.description,
    unit: leaveType.unit,
    allocationType: leaveType.allocationType,
    allocationAmount: String(leaveType.allocationAmount),
    canCarryForward: leaveType.canCarryForward ? "true" : "false",
    carryForwardLimit:
      leaveType.carryForwardLimit === null
        ? ""
        : String(leaveType.carryForwardLimit),
    isPaid: leaveType.isPaid ? "true" : "false",
    requiresApproval: leaveType.requiresApproval ? "true" : "false",
    genderRestriction: leaveType.genderRestriction,
    isActive: leaveType.isActive ? "true" : "false",
  };
}

function EditLeaveTypeForm({
  leaveType,
  open,
  onClose,
}: EditLeaveTypeFormProps): ReactElement {
  const t = useTranslations("admin.createLeaveType");
  const tPage = useTranslations("admin.leaveTypesPage");
  const closeModal = useGenieModalClose(onClose);
  const [updateLeaveTypeMutation, { isLoading: submitting }] =
    useUpdateLeaveTypeMutation();

  const schema = useMemo(
    () =>
      createLeaveTypeSchema({
        nameRequired: t("errors.nameRequired"),
        nameMin: t("errors.nameMin"),
        descriptionRequired: t("errors.descriptionRequired"),
        unitRequired: t("errors.unitRequired"),
        allocationTypeRequired: t("errors.allocationTypeRequired"),
        allocationAmountRequired: t("errors.allocationAmountRequired"),
        allocationAmountInvalid: t("errors.allocationAmountInvalid"),
        carryForwardLimitRequired: t("errors.carryForwardLimitRequired"),
        carryForwardLimitInvalid: t("errors.carryForwardLimitInvalid"),
        genderRequired: t("errors.genderRequired"),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: toFormValues(leaveType),
  });

  useEffect(() => {
    if (!open) return;
    reset(toFormValues(leaveType));
  }, [open, leaveType, reset]);

  const onSubmit = async (values: LeaveTypeFormValues): Promise<void> => {
    try {
      await updateLeaveTypeMutation({
        leaveTypeId: leaveType.id,
        body: toLeaveTypePayload(values),
      }).unwrap();
      toast.success(tPage("save"));
      closeModal();
    } catch (error) {
      toast.error(getLeaveTypeMutationError(error, t("errors.failed")));
    }
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{tPage("editTitle")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{tPage("editSubtitle")}</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-3"
        noValidate
      >
        <LeaveTypeFormFields
          register={register}
          control={control}
          watch={watch}
          errors={errors}
          isSubmitted={isSubmitted}
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
