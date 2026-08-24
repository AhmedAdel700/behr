import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { RequestForm } from "@/components/employee/RequestForm";
import { fetchLeaveType } from "@services/leave-types/leaveTypesService";

export async function NewRequestByType({
  type,
}: {
  type: string;
}): Promise<ReactElement> {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.accessToken || !type.trim()) {
    notFound();
  }

  try {
    const leaveType = await fetchLeaveType(
      session.accessToken,
      locale,
      type,
      session.tokenType,
    );

    if (!leaveType.isActive) {
      notFound();
    }

    return <RequestForm leaveType={leaveType} />;
  } catch {
    notFound();
  }
}
