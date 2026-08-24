import { getTranslations } from "next-intl/server";
import { ComingSoonCard } from "@/components/employee/ComingSoonCard";

export async function Attendance() {
  const t = await getTranslations("employee");

  return (
    <ComingSoonCard
      layout="page"
      title={t("attendance.title")}
      badge={t("comingSoon.badge")}
      heading={t("comingSoon.title")}
      description={t("comingSoon.description")}
    />
  );
}
