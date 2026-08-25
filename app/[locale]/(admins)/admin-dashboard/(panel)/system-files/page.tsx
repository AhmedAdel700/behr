import type { ReactElement } from "react";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminSystemFilesPage } from "@/components/admin/AdminSystemFilesPage";
import { fetchSystemFiles } from "@services/system-files/systemFilesService";
import type { SystemFileRecord } from "@/types/SystemFilesApiTypes";

export default async function AdminSystemFilesRoute(): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();
  let initialData: SystemFileRecord[] | undefined;

  if (session?.accessToken) {
    try {
      initialData = await fetchSystemFiles(
        session.accessToken,
        locale,
        session.tokenType,
      );
    } catch {
      initialData = undefined;
    }
  }

  return <AdminSystemFilesPage initialData={initialData} />;
}
