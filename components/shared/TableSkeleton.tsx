import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

export interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

export function TableSkeleton({
  columnCount,
  rowCount = 8,
}: TableSkeletonProps): ReactElement {
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => rowIndex);
  const columns = Array.from({ length: columnCount }, (_, columnIndex) => columnIndex);

  return (
    <>
      {rows.map((rowIndex) => (
        <tr
          key={`table-skeleton-row-${rowIndex}`}
          className="border-b border-border last:border-b-0"
        >
          {columns.map((columnIndex) => (
            <td
              key={`table-skeleton-cell-${rowIndex}-${columnIndex}`}
              className="px-4 py-3"
            >
              <div
                className={cn(
                  "h-4 max-w-[9rem] animate-pulse rounded-md bg-surface-muted",
                  columnIndex === 0 ? "w-3/4" : "w-full",
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
