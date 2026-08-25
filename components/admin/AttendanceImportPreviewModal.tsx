"use client";

import type { ReactElement, RefObject } from "react";
import { useTranslations } from "next-intl";
import { AttendanceImportPreviewPanel } from "@/components/admin/AttendanceImportPreviewPanel";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import type { AttendanceImportPreviewResult } from "@/types/AttendanceImportApiTypes";

interface AttendanceImportPreviewModalProps {
  open: boolean;
  preview: AttendanceImportPreviewResult | null;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function AttendanceImportPreviewModal({
  open,
  preview,
  confirming,
  onClose,
  onConfirm,
  triggerRef,
}: AttendanceImportPreviewModalProps): ReactElement | null {
  const t = useTranslations("admin.fingerprintImportPage");
  const closeModal = useGenieModalClose(onClose);

  if (!preview) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      onClose={closeModal}
      triggerRef={triggerRef}
      backdropAriaLabel={t("preview.close")}
      backdropDisabled={confirming}
      panelClassName="max-w-6xl"
      layout="scroll"
      ariaLabelledBy="attendance-import-preview-title"
    >
      <AttendanceImportPreviewPanel
        preview={preview}
        confirming={confirming}
        onConfirm={onConfirm}
        onClose={closeModal}
      />
    </ModalShell>
  );
}
