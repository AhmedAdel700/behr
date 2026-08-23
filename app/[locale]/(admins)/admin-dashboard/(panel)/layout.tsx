import { auth } from "@/auth";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSessionUser, mapSessionUserToAdminUser } from "@/lib/auth/mapUser";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const sessionUser = getSessionUser(session);
  const initialAdminUser =
    sessionUser?.appRole === "admin"
      ? mapSessionUserToAdminUser(sessionUser)
      : null;

  return (
    <AdminProviders initialAdminUser={initialAdminUser}>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
