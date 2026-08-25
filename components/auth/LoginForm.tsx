"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "@/app/actions/auth/authActions";
import { Link, useRouter } from "@/i18n/navigation";
import { MainButton } from "@/components/shared/MainButton";
import { MainInput } from "@/components/shared/MainInput";
import {
  createLoginSchema,
  type LoginFormValues,
} from "@/schemas/auth/login.schema";

export function LoginForm({
  showRegisterLink = true,
}: {
  showRegisterLink?: boolean;
}): React.JSX.Element {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      createLoginSchema({
        emailRequired: t("errors.emailRequired"),
        emailInvalid: t("errors.emailInvalid"),
        passwordRequired: t("errors.passwordRequired"),
        passwordMin: t("errors.passwordMin"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitting(true);

    const result = await loginAction({
      email: values.email,
      password: values.password,
      lang: locale,
    });

    if (!result.success) {
      setSubmitting(false);
      const message =
        result.message === "invalidCredentials"
          ? t("errors.invalidCredentials")
          : result.message;
      toast.error(message);
      return;
    }

    setSubmitting(false);
    router.push(result.redirectTo ?? "/");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <div className="space-y-4">
        <MainInput
          label={t("login.email")}
          type="email"
          autoComplete="email"
          placeholder={t("login.emailPlaceholder")}
          startIcon={<Mail />}
          error={errors.email?.message}
          {...register("email")}
        />

        <MainInput
          label={t("login.password")}
          type="password"
          autoComplete="current-password"
          placeholder={t("login.passwordPlaceholder")}
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      <MainButton
        type="submit"
        variant="primary"
        size="lg"
        block
        loading={submitting}
      >
        {t("login.submit")}
      </MainButton>

      {showRegisterLink ? (
        <p className="border-t border-border/80 pt-5 text-center text-sm text-text-secondary">
          {t("login.noAccount")}{" "}
          <Link
            href="/register"
            className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
          >
            {t("login.registerLink")}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
