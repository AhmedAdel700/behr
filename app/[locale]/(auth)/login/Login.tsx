import { CalendarDays, ShieldCheck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthSplitCard } from "@/components/auth/AuthSplitCard";
import { LoginForm } from "@/components/auth/LoginForm";

export async function Login({
  showRegisterLink = true,
}: {
  showRegisterLink?: boolean;
}): Promise<React.JSX.Element> {
  const t = await getTranslations("auth");

  const highlights = [
    { icon: CalendarDays, text: t("login.highlightLeave") },
    { icon: Users, text: t("login.highlightTeam") },
    { icon: ShieldCheck, text: t("login.highlightSecure") },
  ];

  return (
    <AuthShell>
      <AuthSplitCard
        brandTitleLine1={t("login.brandTitleLine1")}
        brandTitleLine2={t("login.brandTitleLine2")}
        brandSubtitle={t("login.brandSubtitle")}
        title={t("login.title")}
        subtitle={t("login.subtitle")}
        highlights={highlights}
      >
        <LoginForm showRegisterLink={showRegisterLink} />
      </AuthSplitCard>
    </AuthShell>
  );
}
