"use client";

import { useEffect, useState, type ReactElement, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useUploadSystemFileMutation } from "@/app/store/api/system-files/systemFilesApi";
import { CustomUpload } from "@/components/shared/CustomUpload";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import {
  isKnownSystemFileType,
} from "@/lib/admin/systemFileDisplay";
import type { KnownSystemFileType, SystemFileRecord } from "@/types/SystemFilesApiTypes";

function resolveSystemFileTypeLabel(
  type: string,
  translateType: (key: `types.${KnownSystemFileType}`) => string,
): string {
  if (isKnownSystemFileType(type)) {
    return translateType(`types.${type}`);
  }

  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface UploadSystemFileModalProps {
  open: boolean;
  file: SystemFileRecord | null;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function UploadSystemFileModal({
  open,
  file,
  onClose,
  triggerRef,
}: UploadSystemFileModalProps): ReactElement | null {
  const t = useTranslations("admin.systemFilesPage.uploadModal");
  const tPage = useTranslations("admin.systemFilesPage");
  const closeModal = useGenieModalClose(onClose);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSystemFileMutation, { isLoading }] =
    useUploadSystemFileMutation();

  useEffect(() => {
    if (!open) {
      setSelectedFile(undefined);
      setUploadError(null);
    }
  }, [open]);

  if (!file) {
    return null;
  }

  const typeLabel = resolveSystemFileTypeLabel(file.type, tPage);

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) {
      setUploadError(t("fileRequired"));
      return;
    }

    setUploadError(null);

    try {
      await uploadSystemFileMutation({
        type: file.type,
        file: selectedFile,
      }).unwrap();
      toast.success(tPage("uploadSuccess"));
      closeModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : tPage("uploadError");
      setUploadError(message);
      toast.error(message);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={closeModal}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
      panelClassName="max-w-lg"
    >
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ink">{t("title")}</h2>
          <p className="text-sm text-text-secondary">
            {t("subtitle", { type: typeLabel })}
          </p>
        </div>

        <CustomUpload
          label={t("fileLabel")}
          hint={t("fileHint")}
          dropLabel={t("dropLabel")}
          browseLabel={t("browseLabel")}
          supportedFormatsLabel={t("supportedFormats")}
          removeLabel={t("removeFile")}
          value={selectedFile}
          onChange={(nextFile) => {
            setSelectedFile(nextFile);
            setUploadError(null);
          }}
          error={uploadError ?? undefined}
          disabled={isLoading}
        />

        <ModalFormActions
          cancelLabel={t("cancel")}
          onCancel={closeModal}
          submitLabel={isLoading ? tPage("uploading") : t("submit")}
          submitType="button"
          onSubmit={() => {
            void handleUpload();
          }}
          loading={isLoading}
          submitDisabled={!selectedFile}
          cancelDisabled={isLoading}
        />
      </div>
    </ModalShell>
  );
}
