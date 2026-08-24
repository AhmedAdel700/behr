import type { ReactElement } from "react";
import {
  leaveTypeBadgeStyle,
  leaveTypeDotStyle,
} from "@/lib/employee/leaveTypeColors";

export function LeaveTypeBadge({
  leaveTypeId,
  name,
}: {
  leaveTypeId: string | number;
  name: string;
}): ReactElement {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={leaveTypeBadgeStyle(leaveTypeId)}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={leaveTypeDotStyle(leaveTypeId)}
        aria-hidden
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
