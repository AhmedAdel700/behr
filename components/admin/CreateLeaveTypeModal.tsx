"use client";

import { useEffect, useMemo, type ReactElement, type RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCreateLeaveTypeMutation } from "@/app/store/api/leave-types/leaveTypesApi";
import {
  getLeaveTypeMutationError,
  LeaveTypeFormFields,
} from "@/components/admin/LeaveTypeFormFields";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import {
  createLeaveTypeSchema,
  emptyLeaveTypeFormValues,
  toLeaveTypePayload,
  type LeaveTypeFormValues,
} from "@/schemas/admin/leave-type.schema";

interface CreateLeaveTypeModalProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function CreateLeaveTypeModal({
  open,
  onClose,
  triggerRef,
}: CreateLeaveTypeModalProps): ReactElement | null {
  const t = useTranslations("admin.createLeaveType");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
    >
      <CreateLeaveTypeForm open={open} onClose={onClose} />
    </ModalShell>
  );
}

interface CreateLeaveTypeFormProps {
  open: boolean;
  onClose: () => void;
}

function CreateLeaveTypeForm({
  open,
  onClose,
}: CreateLeaveTypeFormProps): ReactElement {
  const t = useTranslations("admin.createLeaveType");
  const closeModal = useGenieModalClose(onClose);
  const [createLeaveTypeMutation, { isLoading: submitting }] =
    useCreateLeaveTypeMutation();

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
    defaultValues: emptyLeaveTypeFormValues(),
  });

  useEffect(() => {
    if (!open) return;
    reset(emptyLeaveTypeFormValues());
  }, [open, reset]);

  const onSubmit = async (values: LeaveTypeFormValues): Promise<void> => {
    try {
      await createLeaveTypeMutation({
        body: toLeaveTypePayload(values),
      }).unwrap();
      toast.success(t("success"));
      closeModal();
    } catch (error) {
      toast.error(getLeaveTypeMutationError(error, t("errors.failed")));
    }
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>

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
          cancelLabel={t("cancel")}
          onCancel={closeModal}
          submitLabel={t("submit")}
          loading={submitting}
        />
      </form>
    </>
  );
}
