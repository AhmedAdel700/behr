import type { ReactNode } from "react";
import { auth } from "@/auth";
import { EmployeeShell } from "@/components/employee/EmployeeShell";
import { getSidebarUserInfo } from "@/lib/auth/sidebarUser";

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <EmployeeShell
      primaryRole={session?.user.primaryRole}
      sidebarUser={getSidebarUserInfo(session)}
    >
      {children}
    </EmployeeShell>
  );
}
