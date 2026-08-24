"use client";

import { useEffect, useState, type ReactElement, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { MainInput } from "@/components/shared/MainInput";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";

interface RejectLeaveRequestModalProps {
  open: boolean;
  employeeName: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => boolean | void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function RejectLeaveRequestModal({
  open,
  employeeName,
  loading = false,
  onCancel,
  onConfirm,
  triggerRef,
}: RejectLeaveRequestModalProps): ReactElement | null {
  const t = useTranslations("admin.leaveRequests");

  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
      backdropDisabled={loading}
      layout="center"
      role="alertdialog"
      ariaModal
      ariaLabelledBy="reject-leave-request-title"
      panelClassName="max-w-sm overflow-hidden"
    >
      <RejectLeaveRequestContent
        employeeName={employeeName}
        loading={loading}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </ModalShell>
  );
}

function RejectLeaveRequestContent({
  employeeName,
  loading,
  onCancel,
  onConfirm,
}: {
  employeeName: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => boolean | void;
}): ReactElement {
  const t = useTranslations("admin.leaveRequests");
  const closeModal = useGenieModalClose(onCancel);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setReason("");
    setError("");
  }, [employeeName]);

  const handleConfirm = (): void => {
    if (loading) {
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t("rejectReasonRequired"));
      return;
    }

    const shouldClose = onConfirm(trimmed);
    if (shouldClose === false) {
      return;
    }

    closeModal();
  };

  return (
    <>
      <h2
        id="reject-leave-request-title"
        className="text-base font-semibold text-ink"
      >
        {t("rejectTitle")}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        {t("rejectDescription", { name: employeeName })}
      </p>
      <div className="mt-4">
        <MainInput
          as="textarea"
          label={t("rejectReasonLabel")}
          required
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            if (error) {
              setError("");
            }
          }}
          placeholder={t("rejectReasonPlaceholder")}
          error={error}
          disabled={loading}
        />
      </div>
      <ModalFormActions
        className="mt-4 pt-0"
        cancelLabel={t("cancel")}
        onCancel={closeModal}
        submitLabel={t("rejectConfirm")}
        submitType="button"
        onSubmit={handleConfirm}
        loading={loading}
        cancelDisabled={loading}
        submitVariant="delete-soft"
      />
    </>
  );
}
