"use client";

import { notFound } from "next/navigation";
import { useRef, type ReactElement } from "react";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import {
  leaveRequestsApi,
  useGetLeaveRequestQuery,
} from "@/app/store/api/leave-requests/leaveRequestsApi";
import type { AppDispatch } from "@/app/store/store";
import { RequestForm } from "@/components/employee/RequestForm";
import { parseLeaveRequestFormValues } from "@/lib/employee/leaveRequestDisplay";
import type { LeaveRequestRecord } from "@/types/LeaveRequestsApiTypes";

export function EditRequest({
  id,
  initialData,
}: {
  id: string;
  initialData?: LeaveRequestRecord;
}): ReactElement {
  const t = useTranslations("employee.requests");
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  if (initialData && id && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      leaveRequestsApi.util.upsertQueryData("getLeaveRequest", id, initialData),
    );
  }

  const {
    data: leaveRequest,
    isLoading,
    isError,
  } = useGetLeaveRequestQuery(id, { skip: !id });

  const item = leaveRequest ?? initialData;

  if (!id || ((isError || !item) && !isLoading)) {
    notFound();
  }

  if (!item) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-text-muted">
        {t("loading")}
      </p>
    );
  }

  if (item.status !== "pending") {
    notFound();
  }

  return (
    <RequestForm
      mode="edit"
      requestId={item.id}
      leaveType={item.leaveType}
      initialValues={parseLeaveRequestFormValues(item)}
    />
  );
}
