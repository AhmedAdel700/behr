"use client";

import { useMemo, type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useCreateLeaveRequestMutation } from "@/app/store/api/leave-requests/leaveRequestsApi";
import { MainButton } from "@/components/shared/MainButton";
import { MainDatePicker } from "@/components/shared/MainDatePicker";
import { MainInput } from "@/components/shared/MainInput";
import { MainTimeInput } from "@/components/shared/MainTimeInput";
import {
  buildLeaveRequestDateTime,
  DEFAULT_DAY_END_TIME,
  DEFAULT_DAY_START_TIME,
  getLeaveRequestMutationError,
} from "@/lib/employee/leaveRequestDisplay";
import {
  createRequestSchema,
  type RequestFormValues,
} from "@/schemas/employee/request.schema";
import type { LeaveTypeRecord } from "@/types/LeaveTypesApiTypes";

export interface RequestFormProps {
  leaveType: Pick<LeaveTypeRecord, "id" | "name" | "unit" | "description">;
  mode?: "create" | "edit";
  requestId?: string;
  initialValues?: RequestFormValues;
}

export function RequestForm({
  leaveType,
  mode = "create",
  requestId,
  initialValues,
}: RequestFormProps): ReactElement {
  const t = useTranslations("employee.requests");
  const router = useRouter();
  const isEdit = mode === "edit";
  const [createLeaveRequest, { isLoading: creating }] =
    useCreateLeaveRequestMutation();

  const schema = useMemo(
    () =>
      createRequestSchema(leaveType.unit, {
        fromRequired: t("errors.fromRequired"),
        toRequired: t("errors.toRequired"),
        rangeInvalid: t("errors.rangeInvalid"),
        startTimeRequired: t("errors.startTimeRequired"),
        endTimeRequired: t("errors.endTimeRequired"),
        timeInvalid: t("errors.timeInvalid"),
        reasonRequired: t("errors.reasonRequired"),
        reasonMin: t("errors.reasonMin"),
      }),
    [t, leaveType.unit],
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? {
      from: "",
      to: "",
      reason: "",
      startTime: "",
      endTime: "",
    },
  });

  const isHourUnit = leaveType.unit === "hour";
  const fromValue = watch("from");
  const fromDate = fromValue
    ? new Date(
        Number(fromValue.slice(0, 4)),
        Number(fromValue.slice(5, 7)) - 1,
        Number(fromValue.slice(8, 10)),
      )
    : undefined;

  const onSubmit = async (values: RequestFormValues): Promise<void> => {
    if (isEdit) {
      return;
    }

    const leaveTypeId = Number(leaveType.id);
    if (!Number.isFinite(leaveTypeId)) {
      toast.error(t("errors.failed"));
      return;
    }

    const startTime = isHourUnit
      ? (values.startTime ?? "")
      : DEFAULT_DAY_START_TIME;
    const endTime = isHourUnit ? (values.endTime ?? "") : DEFAULT_DAY_END_TIME;
    const endDate = isHourUnit ? values.from : (values.to ?? values.from);

    try {
      const result = await createLeaveRequest({
        body: {
          leave_type_id: leaveTypeId,
          start_at: buildLeaveRequestDateTime(values.from, startTime),
          end_at: buildLeaveRequestDateTime(endDate, endTime),
          reason: values.reason.trim(),
        },
      }).unwrap();
      toast.success(result.message || t("submitSuccess"));
      reset();
      router.push("/requests");
    } catch (error) {
      toast.error(getLeaveRequestMutationError(error, t("errors.failed")));
    }
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <MainButton
          variant="ghost-brand"
          size="sm"
          startIcon={<ArrowLeft className="size-4 rtl:rotate-180" />}
          link={isEdit && requestId ? `/requests/${requestId}` : "/requests/new"}
        >
          {t("back")}
        </MainButton>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {isEdit ? t("editTitle") : t("new")}
          </h1>
          <p className="text-sm text-text-secondary">
            {leaveType.description.trim()
              ? leaveType.description
              : t(isHourUnit ? "unitHintHour" : "unitHintDay")}
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Controller
          name="from"
          control={control}
          render={({ field }) => (
            <MainDatePicker
              label={isHourUnit ? t("date") : t("from")}
              required
              placeholder={t("pickDate")}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                if (isHourUnit) {
                  setValue("to", value, { shouldValidate: false });
                }
              }}
              onBlur={field.onBlur}
              error={errors.from?.message}
            />
          )}
        />

        {isHourUnit ? null : (
          <Controller
            name="to"
            control={control}
            render={({ field }) => (
              <MainDatePicker
                label={t("to")}
                required
                placeholder={t("pickDate")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                minDate={fromDate}
                error={errors.to?.message}
              />
            )}
          />
        )}

        {isHourUnit ? (
          <>
            <Controller
              name="startTime"
              control={control}
              render={({ field }) => (
                <MainTimeInput
                  label={t("startTime")}
                  required
                  placeholder={t("pickTime")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.startTime?.message}
                />
              )}
            />
            <Controller
              name="endTime"
              control={control}
              render={({ field }) => (
                <MainTimeInput
                  label={t("endTime")}
                  required
                  placeholder={t("pickTime")}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.endTime?.message}
                />
              )}
            />
          </>
        ) : null}

        <MainInput
          as="textarea"
          label={t("reason")}
          required
          placeholder={t("placeholders.reason")}
          error={errors.reason?.message}
          {...register("reason")}
        />

        <MainButton
          type="submit"
          variant="primary"
          block
          className="mt-1"
          loading={creating}
        >
          {isEdit ? t("save") : t("submit")}
        </MainButton>
      </form>
    </div>
  );
}
