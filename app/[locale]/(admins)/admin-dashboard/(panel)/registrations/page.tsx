import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminRegistrationsPage } from "@/components/admin/AdminRegistrationsPage";
import { fetchRegistrationRequests } from "@services/registration-requests/registrationRequestsService";
import type { RegistrationRequestsListResult } from "@/types/RegistrationRequestsApiTypes";

export default async function AdminRegistrationsRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: RegistrationRequestsListResult | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchRegistrationRequests(
        session.accessToken,
        locale,
        session.tokenType,
        { page: 1, status: "pending" },
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminRegistrationsPage initialData={initialData} />;
}
