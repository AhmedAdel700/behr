"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

const inputBaseClassName = cn(
  "h-10 w-full min-w-0 rounded-md border border-border bg-surface px-3",
  "text-sm text-text placeholder:text-text-muted",
  "transition-[border-color,box-shadow,background-color] outline-none",
  "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text",
  "focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50",
  "aria-invalid:border-danger-500 aria-invalid:ring-2 aria-invalid:ring-danger-500/20"
);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <InputPrimitive
        ref={ref}
        type={type}
        data-slot="input"
        suppressHydrationWarning
        className={cn(
          inputBaseClassName,
          type === "search" &&
            "[&::-webkit-search-cancel-button]:cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input, inputBaseClassName };
