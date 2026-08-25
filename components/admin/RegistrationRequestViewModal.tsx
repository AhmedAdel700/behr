"use client";

import type { ReactElement, ReactNode, RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useGetRegistrationRequestByIdQuery } from "@/app/store/api/registration-requests/registrationRequestsApi";
import { MainButton } from "@/components/shared/MainButton";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import { DISPLAY_DATETIME_VALUE_CLASS } from "@/lib/tableCells";
import { cn } from "@/lib/utils";
import type { RegistrationRequestRecord } from "@/types/RegistrationRequestsApiTypes";

interface RegistrationRequestViewModalProps {
  requestId: string | null;
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

function formatTimestamp(value: string | null, locale: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime12(date, resolveTimeLocale(locale));
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function RegistrationRequestViewModal({
  requestId,
  open,
  onClose,
  triggerRef,
}: RegistrationRequestViewModalProps): ReactElement | null {
  const t = useTranslations("admin.registrations");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("close")}
      role="dialog"
      ariaModal
      ariaLabelledBy="registration-request-view-title"
      panelClassName="flex max-w-lg max-h-[calc(100dvh-2rem)] flex-col overflow-hidden p-0"
    >
      <RegistrationRequestViewContent
        requestId={requestId}
        onClose={onClose}
      />
    </ModalShell>
  );
}

interface RegistrationRequestViewContentProps {
  requestId: string | null;
  onClose: () => void;
}

function RegistrationRequestViewContent({
  requestId,
  onClose,
}: RegistrationRequestViewContentProps): ReactElement {
  const t = useTranslations("admin.registrations");
  const locale = useLocale();
  const closeModal = useGenieModalClose(onClose);
  const { data: request, isFetching } = useGetRegistrationRequestByIdQuery(
    requestId ?? "",
    { skip: !requestId },
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2
          id="registration-request-view-title"
          className="text-base font-semibold text-ink"
        >
          {t("detailTitle")}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {request?.name ?? t("detailLoading")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {isFetching && !request ? (
          <p className="text-sm text-text-muted">{t("detailLoading")}</p>
        ) : request ? (
          <RequestDetails request={request} locale={locale} />
        ) : (
          <p className="text-sm text-text-muted">{t("detailError")}</p>
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        <MainButton variant="neutral" size="sm" onClick={closeModal}>
          {t("close")}
        </MainButton>
      </div>
    </div>
  );
}

function RequestDetails({
  request,
  locale,
}: {
  request: RegistrationRequestRecord;
  locale: string;
}): ReactElement {
  const t = useTranslations("admin.registrations");
  const statusLabel =
    request.status === "accepted"
      ? t("status.approved")
      : request.status === "rejected"
        ? t("status.rejected")
        : t("status.pending");

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <DetailField label={t("columns.name")}>{request.name}</DetailField>
      <DetailField label={t("fields.email")}>{request.email}</DetailField>
      <DetailField label={t("fields.phone")}>
        {request.phone || "—"}
      </DetailField>
      <DetailField label={t("fields.fingerprint")}>
        {request.fingerprintNumber || "—"}
      </DetailField>
      <DetailField label={t("fields.position")}>
        {request.positionName || "—"}
      </DetailField>
      <DetailField label={t("fields.department")}>
        {request.departmentName || "—"}
      </DetailField>
      <DetailField label={t("fields.branch")}>
        {request.branchName || "—"}
      </DetailField>
      <DetailField label={t("columns.status")}>{statusLabel}</DetailField>
      <DetailField label={t("columns.submitted")}>
        <span className={DISPLAY_DATETIME_VALUE_CLASS}>
          {formatTimestamp(request.createdAt, locale)}
        </span>
      </DetailField>
      <DetailField label={t("fields.reviewedAt")}>
        <span className={DISPLAY_DATETIME_VALUE_CLASS}>
          {formatTimestamp(request.reviewedAt, locale)}
        </span>
      </DetailField>
      {request.reviewerName ? (
        <DetailField label={t("fields.reviewer")}>
          {request.reviewerName}
        </DetailField>
      ) : null}
      {request.rejectionReason ? (
        <DetailField label={t("fields.rejectionReason")}>
          {request.rejectionReason}
        </DetailField>
      ) : null}
    </dl>
  );
}
