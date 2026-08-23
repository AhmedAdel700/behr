import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSplitCard } from "@/components/auth/AuthSplitCard";
import { LoginForm } from "@/components/auth/LoginForm";
export async function Login({
  showRegisterLink = true,
}: {
  showRegisterLink?: boolean;
}) {
  const t = await getTranslations("auth");

  return (
    <AuthShell>
      <AuthSplitCard
        title={t("login.title")}
        subtitle={t("login.subtitle")}
      >
        <LoginForm showRegisterLink={showRegisterLink} />
      </AuthSplitCard>
    </AuthShell>
  );
}
