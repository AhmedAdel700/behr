"use client";

import { useEffect, useMemo, useState, type ReactElement, type RefObject } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Building2, Mail, MapPinned, Phone } from "lucide-react";
import { toast } from "sonner";
import { useCreateBranchMutation } from "@/app/store/api/branches/branchesApi";
import { BranchMapPicker } from "@/components/shared/BranchMapPicker";
import { ModalFormActions } from "@/components/shared/ModalFormActions";
import { ModalShell } from "@/components/shared/ModalShell";
import { useGenieModalClose } from "@/components/shared/GenieModalShell";
import { MainInput } from "@/components/shared/MainInput";
import { DEFAULT_BRANCH_LOCATION } from "@/lib/admin/branchLocations";
import { upsertBranchRecord } from "@/lib/admin/adminOrgStore";
import {
  createBranchSchema,
  type CreateBranchFormValues,
} from "@/schemas/admin/org.schema";
import type { BranchPayload } from "@/types/BranchesApiTypes";

interface CreateBranchModalProps {
  open: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

export function CreateBranchModal({
  open,
  onClose,
  triggerRef,
}: CreateBranchModalProps): ReactElement | null {
  const t = useTranslations("admin.createBranch");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      triggerRef={triggerRef}
      backdropAriaLabel={t("cancel")}
      panelClassName="max-w-xl"
    >
      <CreateBranchForm open={open} onClose={onClose} />
    </ModalShell>
  );
}

interface CreateBranchFormProps {
  open: boolean;
  onClose: () => void;
}

function CreateBranchForm({ open, onClose }: CreateBranchFormProps): ReactElement {
  const t = useTranslations("admin.createBranch");
  const closeModal = useGenieModalClose(onClose);
  const [createBranchMutation] = useCreateBranchMutation();

  const schema = useMemo(
    () =>
      createBranchSchema({
        nameRequired: t("errors.nameRequired"),
        nameMin: t("errors.nameMin"),
        cityRequired: t("errors.cityRequired"),
        addressRequired: t("errors.addressRequired"),
        emailInvalid: t("errors.emailInvalid"),
        locationRequired: t("errors.locationRequired"),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitted, isSubmitting },
  } = useForm<CreateBranchFormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: emptyValues(),
  });

  const watchedName = watch("name");
  const watchedCity = watch("city");

  useEffect(() => {
    if (!open) return;
    reset(emptyValues());
  }, [open, reset]);

  const onSubmit = async (values: CreateBranchFormValues): Promise<void> => {
    const body: BranchPayload = {
      name: values.name.trim(),
      city: values.city.trim(),
      address: values.address.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      latitude: values.latitude,
      longitude: values.longitude,
    };

    try {
      const branch = await createBranchMutation({ body }).unwrap();
      upsertBranchRecord(branch);
      toast.success(t("success"));
      closeModal();
    } catch (error) {
      toast.error(getMutationErrorMessage(error, t("submitError")));
    }
  };

  return (
    <>
      <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-3"
        noValidate
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MainInput
            label={t("fields.name")}
            startIcon={<Building2 />}
            error={isSubmitted ? errors.name?.message : undefined}
            {...register("name")}
            placeholder={t("placeholders.name")}
          />
          <MainInput
            label={t("fields.city")}
            startIcon={<MapPinned />}
            error={isSubmitted ? errors.city?.message : undefined}
            {...register("city")}
            placeholder={t("placeholders.city")}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MainInput
            label={t("fields.phone")}
            type="tel"
            startIcon={<Phone />}
            error={isSubmitted ? errors.phone?.message : undefined}
            {...register("phone")}
            placeholder={t("placeholders.phone")}
          />
          <MainInput
            label={t("fields.email")}
            type="email"
            startIcon={<Mail />}
            error={isSubmitted ? errors.email?.message : undefined}
            {...register("email")}
            placeholder={t("placeholders.email")}
          />
        </div>

        <Controller
          control={control}
          name="latitude"
          render={({ field: latField }) => (
            <Controller
              control={control}
              name="longitude"
              render={({ field: lngField }) => (
                <BranchMapPicker
                  active={open}
                  label={t("fields.location")}
                  hint={t("locationHint")}
                  findingAddressLabel={t("findingAddress")}
                  searchPlaceholder={t("searchPlaceholder")}
                  searchingLabel={t("searching")}
                  searchNoResultsLabel={t("searchNoResults")}
                  title={
                    [watchedName.trim(), watchedCity.trim()]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                  value={{
                    latitude: latField.value,
                    longitude: lngField.value,
                  }}
                  onChange={(location) => {
                    latField.onChange(location.latitude);
                    lngField.onChange(location.longitude);
                  }}
                  onPlaceSelect={(place) => {
                    latField.onChange(place.location.latitude);
                    lngField.onChange(place.location.longitude);
                  }}
                  onResolvedAddress={(nextAddress) => {
                    setValue("address", nextAddress, {
                      shouldDirty: true,
                      shouldValidate: isSubmitted,
                    });
                  }}
                  error={
                    isSubmitted
                      ? errors.latitude?.message ??
                        errors.longitude?.message ??
                        errors.address?.message
                      : undefined
                  }
                />
              )}
            />
          )}
        />

        <ModalFormActions
          cancelLabel={t("cancel")}
          onCancel={closeModal}
          submitLabel={t("submit")}
          loading={isSubmitting}
        />
      </form>
    </>
  );
}

function emptyValues(): CreateBranchFormValues {
  return {
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    latitude: DEFAULT_BRANCH_LOCATION.latitude,
    longitude: DEFAULT_BRANCH_LOCATION.longitude,
  };
}

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const value = (error as { error: unknown }).error;
    if (typeof value === "string") {
      return value;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
