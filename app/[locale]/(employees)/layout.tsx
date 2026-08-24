import type { ReactNode } from "react";
import { auth } from "@/auth";
import { EmployeeShell } from "@/components/employee/EmployeeShell";

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <EmployeeShell primaryRole={session?.user.primaryRole}>
      {children}
    </EmployeeShell>
  );
}
