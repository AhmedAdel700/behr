"use client";

import { useMemo, useState, useSyncExternalStore, type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { logoutAction } from "@/app/actions/auth/authActions";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";
import { LeaveBalanceSection } from "@/components/employee/LeaveBalanceSection";
import { AvatarUpload, ProfileAvatar } from "@/components/shared/AvatarUpload";
import { MainButton } from "@/components/shared/MainButton";
import { MainInput } from "@/components/shared/MainInput";
import {
  getEmployeeProfileSnapshot,
  subscribeEmployeeProfile,
  updateEmployeeProfile,
} from "@/lib/employee/employeeProfileStore";
import {
  createProfileSchema,
  type ProfileFormValues,
} from "@/schemas/employee/profile.schema";

function DetailRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-xs text-text-muted lg:text-base">{label}</dt>
      <dd className="min-w-0 text-end">
        <p className="text-sm font-medium text-ink lg:text-base">{value}</p>
        {hint ? (
          <p className="mt-0.5 text-xs text-text-muted lg:text-sm">{hint}</p>
        ) : null}
      </dd>
    </div>
  );
}

export function ProfilePageContent(): ReactElement {
  const t = useTranslations("employee.profile");
  const tLabel = useTranslations("employee.profile.labels");
  const tAuth = useTranslations("auth.errors");
  const locale = useLocale();

  useSyncExternalStore(
    subscribeEmployeeProfile,
    getEmployeeProfileSnapshot,
    getEmployeeProfileSnapshot,
  );

  const profile = getEmployeeProfileSnapshot();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      createProfileSchema({
        nameRequired: tAuth("nameRequired"),
        nameMin: tAuth("nameMin"),
        emailRequired: tAuth("emailRequired"),
        emailInvalid: tAuth("emailInvalid"),
        phoneRequired: tAuth("phoneRequired"),
        phoneInvalid: tAuth("phoneInvalid"),
        fingerprintRequired: tAuth("fingerprintRequired"),
        fingerprintInvalid: tAuth("fingerprintInvalid"),
        avatarInvalidType: tAuth("avatarInvalidType"),
        avatarTooLarge: tAuth("avatarTooLarge"),
      }),
    [tAuth],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      fingerprintNumber: profile.fingerprintNumber,
      avatar: undefined,
    },
  });

  const openEdit = (): void => {
    reset({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      fingerprintNumber: profile.fingerprintNumber,
      avatar: undefined,
    });
    setEditing(true);
  };

  const cancelEdit = (): void => {
    setEditing(false);
  };

  const onSubmit = async (values: ProfileFormValues): Promise<void> => {
    setSubmitting(true);
    await updateEmployeeProfile({
      name: values.name,
      email: values.email,
      phone: values.phone,
      fingerprintNumber: values.fingerprintNumber,
      avatarFile: values.avatar,
    });
    setSubmitting(false);
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ProfileAvatar
              src={profile.avatarSrc}
              alt={profile.name}
              className="size-20 shrink-0 rounded-2xl object-cover ring-2 ring-primary-100"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-ink">
                {profile.name}
              </h1>
              <p className="text-sm text-text-secondary">{profile.role}</p>
              <p className="mt-1 text-xs text-text-muted">
                {tLabel("employeeId")} · {profile.employeeId}
              </p>
            </div>
          </div>

          {!editing ? (
            <MainButton
              type="button"
              variant="edit-soft"
              size="sm"
              iconOnly
              aria-label={t("edit")}
              startIcon={<Pencil className="size-4" />}
              onClick={openEdit}
            />
          ) : null}
        </div>
      </section>

      {editing ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <h2 className="mb-3 text-sm font-semibold text-ink">{t("editTitle")}</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3"
            noValidate
          >
            <Controller
              name="avatar"
              control={control}
              render={({ field }) => (
                <AvatarUpload
                  label={t("avatarLabel")}
                  hint={t("avatarHint")}
                  uploadLabel={t("avatarUpload")}
                  changeLabel={t("avatarChange")}
                  removeLabel={t("avatarRemove")}
                  previewSrc={profile.avatarSrc}
                  value={field.value}
                  error={errors.avatar?.message}
                  onChange={field.onChange}
                />
              )}
            />

            <MainInput
              label={tLabel("email")}
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <MainInput
              label={tLabel("phone")}
              type="tel"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />

            <MainInput
              label={t("nameLabel")}
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />

            <MainInput
              label={tLabel("fingerprintNumber")}
              type="tel"
              autoComplete="off"
              maxLength={20}
              error={errors.fingerprintNumber?.message}
              {...register("fingerprintNumber")}
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <MainButton
                type="button"
                variant="neutral"
                block
                disabled={submitting}
                onClick={cancelEdit}
              >
                {t("cancel")}
              </MainButton>
              <MainButton
                type="submit"
                variant="primary"
                block
                loading={submitting}
              >
                {t("save")}
              </MainButton>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-ink">{tLabel("work")}</h2>
            <dl className="space-y-3">
              <DetailRow label={tLabel("department")} value={profile.department} />
              <DetailRow label={tLabel("branch")} value={profile.branch} />
              <DetailRow
                label={tLabel("lineManager")}
                value={profile.lineManager}
                hint={profile.lineManagerRole}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-ink">{tLabel("contact")}</h2>
            <dl className="space-y-3">
              <DetailRow label={tLabel("email")} value={profile.email} />
              <DetailRow label={tLabel("phone")} value={profile.phone} />
              <DetailRow
                label={tLabel("fingerprintNumber")}
                value={profile.fingerprintNumber}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-ink">{tLabel("employment")}</h2>
            <dl className="space-y-3">
              <DetailRow
                label={tLabel("employmentType")}
                value={profile.employmentType}
              />
              <DetailRow label={tLabel("joinDate")} value={profile.joinDate} />
            </dl>
          </section>
        </>
      )}

      <LeaveBalanceSection />

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">{t("language")}</p>
          <LocaleSwitcher tone="light" />
        </div>
      </section>

      <MainButton
        variant="delete"
        block
        onClick={() => {
          void logoutAction(locale);
        }}
      >
        {t("signOut")}
      </MainButton>
    </div>
  );
}
