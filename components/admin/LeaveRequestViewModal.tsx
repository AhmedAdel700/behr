"use client";

import {
  CalendarClock,
  CalendarDays,
  CircleDot,
  Clock,
  MessageSquare,
  Tag,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useRef, type ReactElement, type ReactNode, type RefObject } from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import {
  leaveRequestsApi,
  useGetLeaveRequestQuery,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { MainButton } from "@/components/shared/MainButton";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { ProfileAvatar } from "@/components/shared/AvatarUpload";
import { resolveAvatarSrc } from "@/lib/employee/avatar";
import { leaveTypeDotStyle } from "@/lib/employee/leaveTypeColors";
import { formatLeaveRequestRange } from "@/lib/employee/leaveRequestDisplay";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import {
  DISPLAY_DATE_RANGE_VALUE_CLASS,
  DISPLAY_DATETIME_VALUE_CLASS,
} from "@/lib/tableCells";
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

function LeaveTypeValue({
  leaveTypeId,
  name,
}: {
  leaveTypeId: string | number;
  name: string;
}): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 font-medium">
      <span
        className="size-2 shrink-0 rounded-full"
        style={leaveTypeDotStyle(leaveTypeId)}
        aria-hidden
      />
      {name}
    </span>
  );
}

function StatusValue({
  status,
  label,
}: {
  status: LeaveRequestStatus;
  label: string;
}): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-medium",
        status === "pending" && "text-warning-700",
        status === "approved" && "text-success-700",
        status === "rejected" && "text-danger-700",
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          status === "pending" && "bg-warning-500",
          status === "approved" && "bg-success-500",
          status === "rejected" && "bg-danger-500",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

function DetailSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-surface-muted/30",
        className,
      )}
    >
      {children}
    </section>
  );
}

function DetailField({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={className}>
      <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm text-ink">{children}</dd>
    </div>
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
          className="text-base font-semibold tracking-tight text-ink"
        >
          {t("detailTitle")}
        </h2>
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

      <div className="flex justify-end border-t border-border px-5 py-3">
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
  const dateRange = formatLeaveRequestRange(
    request.startAt,
    request.endAt,
    locale,
    request.leaveType.unit,
  );
  const submittedAt = formatTimestamp(request.createdAt, locale);
  const reviewedAt = request.reviewedAt
    ? formatTimestamp(request.reviewedAt, locale)
    : null;
  const hasReviewInfo =
    request.reviewer !== null ||
    reviewedAt !== null ||
    Boolean(request.rejectionReason?.trim());

  return (
    <div className="space-y-4">
      <DetailSection className="p-4">
        <div className="flex items-start gap-3">
          <ProfileAvatar
            src={resolveAvatarSrc(request.employee?.image)}
            alt={employeeName}
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full object-cover ring-2 ring-surface"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{employeeName}</p>
            {request.employee?.email ? (
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {request.employee.email}
              </p>
            ) : null}
          </div>
        </div>
      </DetailSection>

      <DetailSection className="p-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailField label={t("columns.type")} icon={Tag}>
            <LeaveTypeValue
              leaveTypeId={request.leaveType.id}
              name={request.leaveType.name}
            />
          </DetailField>
          <DetailField label={t("columns.status")} icon={CircleDot}>
            <StatusValue
              status={request.status}
              label={tFields(`status.${request.status}`)}
            />
          </DetailField>
          <DetailField label={tFields("dates")} icon={CalendarDays}>
            <span className={cn("font-medium", DISPLAY_DATE_RANGE_VALUE_CLASS)}>
              {dateRange}
            </span>
          </DetailField>
          <DetailField label={tFields("createdAt")} icon={Clock}>
            <span className={cn("font-medium", DISPLAY_DATETIME_VALUE_CLASS)}>
              {submittedAt}
            </span>
          </DetailField>
        </dl>
      </DetailSection>

      <DetailSection className="p-4">
        <DetailField label={tFields("reason")} icon={MessageSquare}>
          <p className="whitespace-pre-wrap text-text-secondary">
            {request.reason?.trim() ? request.reason : "—"}
          </p>
        </DetailField>
      </DetailSection>

      {hasReviewInfo ? (
        <DetailSection className="p-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {request.reviewer ? (
              <DetailField label={tFields("reviewer")} icon={UserCheck}>
                <span className="font-medium">{request.reviewer.fullName}</span>
              </DetailField>
            ) : null}
            {reviewedAt ? (
              <DetailField label={tFields("reviewedAt")} icon={CalendarClock}>
                <span className={cn("font-medium", DISPLAY_DATETIME_VALUE_CLASS)}>
                  {reviewedAt}
                </span>
              </DetailField>
            ) : null}
            {request.rejectionReason ? (
              <DetailField
                label={tFields("rejectionReason")}
                icon={MessageSquare}
                className="sm:col-span-2"
              >
                <p className="whitespace-pre-wrap text-text-secondary">
                  {request.rejectionReason}
                </p>
              </DetailField>
            ) : null}
          </dl>
        </DetailSection>
      ) : null}
    </div>
  );
}
