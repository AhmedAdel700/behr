"use client";

import { useRef, type ReactElement, type ReactNode, type RefObject } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import {
  leaveRequestsApi,
  useGetLeaveRequestQuery,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { LeaveTypeBadge } from "@/components/employee/LeaveTypeBadge";
import { MainButton } from "@/components/shared/MainButton";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { ProfileAvatar } from "@/components/shared/AvatarUpload";
import { resolveAvatarSrc } from "@/lib/employee/avatar";
import { formatLeaveRequestRange } from "@/lib/employee/leaveRequestDisplay";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import { cn } from "@/lib/utils";
import type {
  LeaveRequestRecord,
  LeaveRequestStatus,
} from "@/types/LeaveRequestsApiTypes";

interface LeaveRequestViewModalProps {
  requestId: string | null;
  initialRequest?: LeaveRequestRecord | null;
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
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={className}>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: LeaveRequestStatus;
  label: string;
}): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-[6.75rem] shrink-0 items-center justify-center rounded-none px-1 text-center text-[11px] font-semibold leading-none",
        status === "pending" && "bg-warning-50 text-warning-700",
        status === "approved" && "bg-success-50 text-success-700",
        status === "rejected" && "bg-danger-50 text-danger-700",
      )}
    >
      {label}
    </span>
  );
}

export function LeaveRequestViewModal({
  requestId,
  initialRequest,
  open,
  onClose,
  triggerRef,
}: LeaveRequestViewModalProps): ReactElement | null {
  const t = useTranslations("admin.leaveRequests");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("close")}
      role="dialog"
      ariaModal
      ariaLabelledBy="leave-request-view-title"
      panelClassName="flex max-w-lg max-h-[calc(100dvh-2rem)] flex-col overflow-hidden p-0"
    >
      <LeaveRequestViewContent
        requestId={requestId}
        initialRequest={initialRequest}
        onClose={onClose}
      />
    </ModalShell>
  );
}

function LeaveRequestViewContent({
  requestId,
  initialRequest,
  onClose,
}: {
  requestId: string | null;
  initialRequest?: LeaveRequestRecord | null;
  onClose: () => void;
}): ReactElement {
  const t = useTranslations("admin.leaveRequests");
  const locale = useLocale();
  const closeModal = useGenieModalClose(onClose);
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  if (
    initialRequest &&
    requestId === initialRequest.id &&
    !didSeedCache.current
  ) {
    didSeedCache.current = true;
    dispatch(
      leaveRequestsApi.util.upsertQueryData(
        "getLeaveRequest",
        initialRequest.id,
        initialRequest,
      ),
    );
  }

  if (requestId !== initialRequest?.id) {
    didSeedCache.current = false;
  }

  const { data: request, isFetching } = useGetLeaveRequestQuery(
    requestId ?? "",
    { skip: !requestId },
  );
  const resolved = request ?? initialRequest ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2
          id="leave-request-view-title"
          className="text-base font-semibold text-ink"
        >
          {t("detailTitle")}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {resolved?.employee?.fullName ?? t("detailLoading")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {isFetching && !resolved ? (
          <p className="text-sm text-text-muted">{t("detailLoading")}</p>
        ) : resolved ? (
          <RequestDetails request={resolved} locale={locale} />
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
  request: LeaveRequestRecord;
  locale: string;
}): ReactElement {
  const t = useTranslations("admin.leaveRequests");
  const tFields = useTranslations("employee.requests");
  const employeeName = request.employee?.fullName ?? "—";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <LeaveTypeBadge
          className="h-7 w-[6.75rem] justify-center rounded-none px-1 text-center"
          leaveTypeId={request.leaveType.id}
          name={request.leaveType.name}
        />
        <StatusBadge
          status={request.status}
          label={tFields(`status.${request.status}`)}
        />
      </div>

      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <DetailField label={t("columns.employee")} className="sm:col-span-2">
          <span className="flex items-center gap-2.5">
            <ProfileAvatar
              src={resolveAvatarSrc(request.employee?.image)}
              alt={employeeName}
              width={36}
              height={36}
              className="size-9 rounded-full object-cover"
            />
            <span className="min-w-0">
              <span className="block font-medium">{employeeName}</span>
              {request.employee?.email ? (
                <span className="block text-xs text-text-muted">
                  {request.employee.email}
                </span>
              ) : null}
            </span>
          </span>
        </DetailField>
        <DetailField label={tFields("dates")}>
          <span className="font-medium">
            {formatLeaveRequestRange(
              request.startAt,
              request.endAt,
              locale,
              request.leaveType.unit,
            )}
          </span>
        </DetailField>
        <DetailField label={tFields("createdAt")}>
          <span className="font-medium">
            {formatTimestamp(request.createdAt, locale)}
          </span>
        </DetailField>
        <DetailField label={tFields("reason")} className="sm:col-span-2">
          <span className="text-text-secondary">{request.reason || "—"}</span>
        </DetailField>
        {request.reviewer ? (
          <DetailField label={tFields("reviewer")}>
            {request.reviewer.fullName}
          </DetailField>
        ) : null}
        {request.reviewedAt ? (
          <DetailField label={tFields("reviewedAt")}>
            {formatTimestamp(request.reviewedAt, locale)}
          </DetailField>
        ) : null}
        {request.rejectionReason ? (
          <DetailField
            label={tFields("rejectionReason")}
            className="sm:col-span-2"
          >
            <span className="text-text-secondary">{request.rejectionReason}</span>
          </DetailField>
        ) : null}
      </dl>
    </div>
  );
}
