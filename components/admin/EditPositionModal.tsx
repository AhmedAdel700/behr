"use client";

import { useEffect, useMemo, type ReactElement, type RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useUpdatePositionMutation } from "@/app/store/api/positions/positionsApi";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { MainInput } from "@/components/shared/MainInput";
import {
  createPositionSchema,
  type PositionFormValues,
} from "@/schemas/admin/position.schema";
import type { PositionRecord } from "@/types/PositionsApiTypes";

interface EditPositionModalProps {
  position: PositionRecord;
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function EditPositionModal({
  position,
  open,
  onClose,
  triggerRef,
}: EditPositionModalProps): ReactElement | null {
  const t = useTranslations("admin.createPosition");
  const tPage = useTranslations("admin.positionsPage");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={tPage("cancel")}
    >
      <EditPositionForm position={position} open={open} onClose={onClose} />
    </ModalShell>
  );
}

interface EditPositionFormProps {
  position: PositionRecord;
  open: boolean;
  onClose: () => void;
}

function EditPositionForm({
  position,
  open,
  onClose,
}: EditPositionFormProps): ReactElement {
  const t = useTranslations("admin.createPosition");
  const tPage = useTranslations("admin.positionsPage");
  const closeModal = useGenieModalClose(onClose);
  const [updatePositionMutation, { isLoading: submitting }] =
    useUpdatePositionMutation();

  const schema = useMemo(
    () =>
      createPositionSchema({
        nameRequired: t("errors.nameRequired"),
        nameMin: t("errors.nameMin"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<PositionFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: { name: position.name },
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: position.name });
  }, [open, position, reset]);

  const onSubmit = async (values: PositionFormValues): Promise<void> => {
    try {
      await updatePositionMutation({
        positionId: position.id,
        body: { name: values.name.trim() },
      }).unwrap();
      toast.success(tPage("save"));
      closeModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.duplicate");
      setError("name", { message });
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
        <MainInput
          label={t("fields.name")}
          startIcon={<Briefcase />}
          error={isSubmitted ? errors.name?.message : undefined}
          {...register("name")}
          placeholder={t("placeholders.name")}
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
