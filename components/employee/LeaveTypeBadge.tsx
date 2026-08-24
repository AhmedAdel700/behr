import type { ReactElement } from "react";
import {
  leaveTypeBadgeStyle,
  leaveTypeDotStyle,
} from "@/lib/employee/leaveTypeColors";
import { cn } from "@/lib/utils";

export function LeaveTypeBadge({
  leaveTypeId,
  name,
  className,
}: {
  leaveTypeId: string | number;
  name: string;
  className?: string;
}): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold leading-none",
        className,
      )}
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
