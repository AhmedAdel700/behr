"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Briefcase,
  Clock,
  Fingerprint,
  Lock,
  Mail,
  MapPinned,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetPublicBranchDepartmentsQuery,
  useGetPublicBranchesQuery,
  useGetPublicJobPositionsQuery,
  useRegisterAccountMutation,
} from "@/app/store/api/public/publicOrgApi";
import { Link, useRouter } from "@/i18n/navigation";
import {
  RegisterWizardShell,
  type RegisterStepId,
} from "@/components/auth/RegisterWizardShell";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { MainButton } from "@/components/shared/MainButton";
import { MainInput } from "@/components/shared/MainInput";
import { MainSelect } from "@/components/shared/MainSelect";
import {
  createRegisterSchema,
  createRegisterStepSchema,
  type RegisterFormValues,
} from "@/schemas/auth/register.schema";
import type { RegisterPayload } from "@/types/PublicOrgApiTypes";

const STEP_ORDER: RegisterStepId[] = ["profile", "work", "security"];
const REVIEW_REDIRECT_SECONDS = 5;

const STEP_FIELDS: Record<RegisterStepId, (keyof RegisterFormValues)[]> = {
  profile: ["name", "email", "phone", "avatar"],
  work: ["fingerprintNumber", "position", "branch", "department"],
  security: ["password", "confirmPassword"],
};

function toFormErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string; code: string }[],
): FieldErrors<RegisterFormValues> {
  const errors: FieldErrors<RegisterFormValues> = {};

  for (const issue of issues) {
    const name = issue.path[0];
    if (typeof name !== "string" || name in errors) {
      continue;
    }

    const key = name as keyof RegisterFormValues;
    errors[key] = {
      type: issue.code,
      message: issue.message,
    };
  }

  return errors;
}

function getRegisterErrorMessages(error: unknown, fallback: string): string[] {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null && "messages" in data) {
      const rawMessages = data.messages;
      if (Array.isArray(rawMessages)) {
        const messages = rawMessages.filter(
          (message): message is string =>
            typeof message === "string" && Boolean(message.trim()),
        );
        if (messages.length > 0) {
          return messages;
        }
      }
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "string" &&
    error.error.trim()
  ) {
    return [error.error];
  }

  if (error instanceof Error && error.message.trim()) {
    return [error.message];
  }

  return [fallback];
}

export function RegisterForm(): ReactElement {
  const t = useTranslations("auth");
  const router = useRouter();
  const [step, setStep] = useState<RegisterStepId>("profile");
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REVIEW_REDIRECT_SECONDS);
  const [securityAttempted, setSecurityAttempted] = useState(false);
  const [registerAccount, { isLoading: submitting }] =
    useRegisterAccountMutation();

  const schemaMessages = useMemo(
    () => ({
      nameRequired: t("errors.nameRequired"),
      nameMin: t("errors.nameMin"),
      emailRequired: t("errors.emailRequired"),
      emailInvalid: t("errors.emailInvalid"),
      phoneRequired: t("errors.phoneRequired"),
      phoneInvalid: t("errors.phoneInvalid"),
      fingerprintRequired: t("errors.fingerprintRequired"),
      fingerprintInvalid: t("errors.fingerprintInvalid"),
      branchRequired: t("errors.branchRequired"),
      departmentRequired: t("errors.departmentRequired"),
      positionRequired: t("errors.positionRequired"),
      positionMin: t("errors.positionMin"),
      passwordRequired: t("errors.passwordRequired"),
      passwordMin: t("errors.passwordMin"),
      confirmPasswordRequired: t("errors.confirmPasswordRequired"),
      passwordMismatch: t("errors.passwordMismatch"),
      avatarInvalidType: t("errors.avatarInvalidType"),
      avatarTooLarge: t("errors.avatarTooLarge"),
    }),
    [t],
  );

  const stepRef = useRef<RegisterStepId>(step);
  const validationIntentRef = useRef<"step" | "submit">("step");
  const messagesRef = useRef(schemaMessages);
  stepRef.current = step;
  messagesRef.current = schemaMessages;

  const resolver = useCallback<Resolver<RegisterFormValues>>(
    async (values) => {
      const schema =
        validationIntentRef.current === "submit"
          ? createRegisterSchema(messagesRef.current)
          : createRegisterStepSchema(stepRef.current, messagesRef.current);

      const parsed = schema.safeParse(values);
      if (parsed.success) {
        return { values, errors: {} };
      }

      return {
        values: {},
        errors: toFormErrors(parsed.error.issues),
      };
    },
    [],
  );

  const steps = useMemo(
    () =>
      STEP_ORDER.map((id) => ({
        id,
        label: t(`register.steps.${id}.title`),
        description: t(`register.steps.${id}.description`),
      })),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldUnregister: false,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      fingerprintNumber: "",
      branch: "",
      department: "",
      position: "",
      password: "",
      confirmPassword: "",
      avatar: undefined,
    },
  });

  const selectedBranchId = useWatch({ control, name: "branch" });
  const { data: branches = [] } = useGetPublicBranchesQuery();
  const { data: jobPositions = [] } = useGetPublicJobPositionsQuery();
  const { data: departments = [], isFetching: loadingDepartments } =
    useGetPublicBranchDepartmentsQuery(selectedBranchId, {
      skip: !selectedBranchId,
    });

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    [branches],
  );

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({
        value: department.id,
        label: department.name,
      })),
    [departments],
  );

  const positionOptions = useMemo(
    () =>
      jobPositions.map((position) => ({
        value: position.id,
        label: position.name,
      })),
    [jobPositions],
  );

  useEffect(() => {
    if (!submitted) {
      return;
    }

    setSecondsLeft(REVIEW_REDIRECT_SECONDS);
    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    const timeoutId = window.setTimeout(() => {
      router.push("/login");
    }, REVIEW_REDIRECT_SECONDS * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [router, submitted]);

  const stepIndex = STEP_ORDER.indexOf(step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEP_ORDER.length - 1;

  const goBack = (): void => {
    if (isFirst || submitting) return;
    validationIntentRef.current = "step";
    setSecurityAttempted(false);
    clearErrors(STEP_FIELDS[step]);
    setStep(STEP_ORDER[stepIndex - 1] ?? "profile");
  };

  const goNext = async (): Promise<void> => {
    if (isLast || submitting) return;

    validationIntentRef.current = "step";
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) return;

    const nextStep = STEP_ORDER[stepIndex + 1];
    if (!nextStep) return;

    clearErrors(STEP_FIELDS[nextStep]);
    setStep(nextStep);
  };

  const submitRegistration = handleSubmit(async (values): Promise<void> => {
    const branchId = Number(values.branch);
    const departmentId = Number(values.department);
    const jobPositionId = Number(values.position);

    if (
      !Number.isFinite(branchId) ||
      !Number.isFinite(departmentId) ||
      !Number.isFinite(jobPositionId)
    ) {
      toast.error(t("errors.registerFailed"));
      return;
    }

    const body: RegisterPayload = {
      full_name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      password: values.password,
      password_confirmation: values.confirmPassword,
      fingerprint_number: values.fingerprintNumber.trim(),
      branch_id: branchId,
      department_id: departmentId,
      job_position_id: jobPositionId,
      ...(values.avatar ? { image: values.avatar } : {}),
    };

    try {
      await registerAccount(body).unwrap();
      setSubmitted(true);
    } catch (error) {
      const messages = getRegisterErrorMessages(
        error,
        t("errors.registerFailed"),
      );
      for (const message of messages) {
        toast.error(message);
      }
    }
  });

  const onFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (submitting) return;

    if (!isLast) {
      void goNext();
      return;
    }

    validationIntentRef.current = "submit";
    setSecurityAttempted(true);
    void submitRegistration(event);
  };

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 text-center shadow-md sm:px-10">
        <BrandLogo size="lg" className="mx-auto" />
        <div className="mx-auto mt-6 grid size-14 place-items-center rounded-full bg-primary-50 text-primary-700">
          <Clock className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
          {t("register.reviewTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {t("register.reviewDescription")}
        </p>
        <p className="mt-6 text-sm font-medium text-ink">
          {t("register.reviewRedirect", { seconds: secondsLeft })}
        </p>
        <MainButton
          variant="primary"
          className="mt-6"
          link="/login"
        >
          {t("register.loginNow")}
        </MainButton>
      </div>
    );
  }

  return (
    <RegisterWizardShell
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      steps={steps}
      currentStep={step}
      footer={
        <>
          <div className="grid grid-cols-2 gap-2">
            <MainButton
              type="button"
              variant="neutral"
              block
              disabled={isFirst || submitting}
              startIcon={<ArrowLeft className="size-4 rtl:rotate-180" />}
              onClick={goBack}
            >
              {t("register.back")}
            </MainButton>

            {isLast ? (
              <MainButton
                type="button"
                variant="primary"
                block
                loading={submitting}
                onClick={() => {
                  validationIntentRef.current = "submit";
                  setSecurityAttempted(true);
                  void submitRegistration();
                }}
              >
                {t("register.submit")}
              </MainButton>
            ) : (
              <MainButton
                type="button"
                variant="primary"
                block
                endIcon={<ArrowRight className="size-4 rtl:rotate-180" />}
                onClick={() => {
                  void goNext();
                }}
              >
                {t("register.next")}
              </MainButton>
            )}
          </div>

          <p className="text-center text-sm text-text-secondary">
            {t("register.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              {t("register.loginLink")}
            </Link>
          </p>
        </>
      }
    >
      <form
        id="register-form"
        onSubmit={onFormSubmit}
        className="space-y-3"
        noValidate
      >
        {step === "profile" ? (
          <>
            <Controller
              name="avatar"
              control={control}
              render={({ field }) => (
                <AvatarUpload
                  hint={t("register.avatarHint")}
                  optionalLabel={t("register.avatarOptional")}
                  uploadLabel={t("register.avatarUpload")}
                  changeLabel={t("register.avatarChange")}
                  removeLabel={t("register.avatarRemove")}
                  optional
                  value={field.value}
                  error={errors.avatar?.message}
                  onChange={field.onChange}
                />
              )}
            />
            <MainInput
              label={t("register.name")}
              autoComplete="name"
              startIcon={<User />}
              error={errors.name?.message}
              {...register("name")}
              placeholder={t("register.namePlaceholder")}
            />
            <MainInput
              label={t("register.email")}
              type="email"
              autoComplete="email"
              startIcon={<Mail />}
              error={errors.email?.message}
              {...register("email")}
              placeholder={t("register.emailPlaceholder")}
            />
            <MainInput
              label={t("register.phone")}
              type="tel"
              autoComplete="tel"
              startIcon={<Phone />}
              error={errors.phone?.message}
              {...register("phone")}
              placeholder={t("register.phonePlaceholder")}
            />
          </>
        ) : null}

        {step === "work" ? (
          <>
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <MainSelect
                  label={t("register.position")}
                  startIcon={<Briefcase />}
                  error={errors.position?.message}
                  options={positionOptions}
                  placeholder={t("register.positionPlaceholder")}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
            <MainInput
              label={t("register.fingerprintNumber")}
              type="text"
              autoComplete="off"
              startIcon={<Fingerprint />}
              error={errors.fingerprintNumber?.message}
              maxLength={20}
              {...register("fingerprintNumber")}
              placeholder={t("register.fingerprintPlaceholder")}
            />
            <Controller
              name="branch"
              control={control}
              render={({ field }) => (
                <MainSelect
                  label={t("register.branchLabel")}
                  startIcon={<MapPinned />}
                  error={errors.branch?.message}
                  options={branchOptions}
                  placeholder={t("register.branchPlaceholder")}
                  value={field.value}
                  onValueChange={(value) => {
                    if (value !== field.value) {
                      setValue("department", "", { shouldValidate: false });
                    }
                    field.onChange(value);
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <MainSelect
                  label={t("register.departmentLabel")}
                  startIcon={<Building2 />}
                  error={errors.department?.message}
                  options={departmentOptions}
                  placeholder={
                    selectedBranchId
                      ? loadingDepartments
                        ? t("register.departmentLoading")
                        : t("register.departmentPlaceholder")
                      : t("register.selectBranchFirst")
                  }
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  disabled={!selectedBranchId || loadingDepartments}
                />
              )}
            />
          </>
        ) : null}

        {step === "security" ? (
          <>
            <MainInput
              label={t("register.password")}
              type="password"
              autoComplete="new-password"
              startIcon={<Lock />}
              error={
                securityAttempted ? errors.password?.message : undefined
              }
              {...register("password")}
              placeholder={t("register.passwordPlaceholder")}
            />
            <MainInput
              label={t("register.confirmPassword")}
              type="password"
              autoComplete="new-password"
              startIcon={<Lock />}
              error={
                securityAttempted
                  ? errors.confirmPassword?.message
                  : undefined
              }
              {...register("confirmPassword")}
              placeholder={t("register.confirmPasswordPlaceholder")}
            />
          </>
        ) : null}
      </form>
    </RegisterWizardShell>
  );
}
