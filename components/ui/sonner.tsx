"use client";

import type { ReactElement } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps): ReactElement {
  return (
    <Sonner
      position="top-center"
      closeButton={false}
      richColors={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-xl border p-4 shadow-xs font-sans",
          title: "text-sm font-semibold",
          description: "text-sm opacity-90",
          success:
            "border-success-200 bg-success-50 text-success-800 [&_[data-title]]:text-success-800 [&_[data-icon]]:text-success-600",
          error:
            "border-danger-200 bg-danger-50 text-danger-800 [&_[data-title]]:text-danger-800 [&_[data-icon]]:text-danger-600",
          icon: "size-5 shrink-0",
        },
      }}
      {...props}
    />
  );
}
