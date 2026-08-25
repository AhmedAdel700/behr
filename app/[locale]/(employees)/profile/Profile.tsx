import type { ReactElement } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { ProfilePageContent } from "@/components/employee/ProfilePageContent";
import { fetchProfile } from "@services/auth/profileService";
import { fetchLeaveBalances } from "@services/leave-balances/leaveBalancesService";
import type { LeaveBalanceRecord } from "@/types/LeaveBalancesApiTypes";
import type { ProfileResult } from "@/types/ProfileApiTypes";

export async function Profile(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("employee.profile");
  let initialProfile: ProfileResult | undefined;
  let initialLeaveBalances: LeaveBalanceRecord[] | undefined;

  if (session?.accessToken) {
    try {
      initialProfile = await fetchProfile(
        session.accessToken,
        locale,
        session.tokenType,
        t("notAvailable"),
      );
    } catch {
      initialProfile = undefined;
    }

    try {
      initialLeaveBalances = await fetchLeaveBalances(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialLeaveBalances = undefined;
    }
  }

  return (
    <ProfilePageContent
      initialProfile={initialProfile}
      initialLeaveBalances={initialLeaveBalances}
    />
  );
}
