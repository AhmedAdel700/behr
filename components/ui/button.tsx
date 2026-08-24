"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border border-transparent bg-clip-padding rounded-md text-sm font-medium leading-none whitespace-nowrap transition-all outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:enabled:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-text-inverse shadow-primary-sm hover:bg-primary-600 active:bg-primary-700",
        cta: "bg-ink text-text-inverse shadow-sm hover:bg-ink-700 active:bg-ink-800",
        add: "bg-success-500 text-text-inverse hover:bg-success-600 active:bg-success-700",
        delete:
          "bg-danger-500 text-text-inverse hover:bg-danger-600 active:bg-danger-700",
        warning:
          "bg-warning-500 text-ink hover:bg-warning-600 hover:text-text-inverse active:bg-warning-700 active:text-text-inverse",
        edit: "bg-primary-500 text-text-inverse shadow-primary-sm hover:bg-primary-600 active:bg-primary-700",
        "add-soft":
          "border-success-100 bg-success-50 text-success-700 hover:border-success-200 hover:bg-success-100",
        "delete-soft":
          "border-danger-100 bg-danger-50 text-danger-700 hover:border-danger-200 hover:bg-danger-100",
        "edit-soft":
          "border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300 hover:bg-primary-100",
        "warning-soft":
          "border-warning-100 bg-warning-50 text-warning-700 hover:border-warning-200 hover:bg-warning-100",
        ghost:
          "bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text",
        "ghost-brand":
          "bg-transparent text-primary-600 hover:bg-primary-50 hover:text-primary-700",
        "ghost-delete":
          "bg-transparent text-danger-600 hover:bg-danger-50 hover:text-danger-700",
        neutral:
          "border-border bg-surface text-text shadow-xs hover:border-border-strong hover:bg-surface-muted active:bg-neutral-200",
        link: "h-auto rounded-sm border-0 bg-transparent p-0 font-medium leading-normal text-primary-600 shadow-none hover:text-primary-700 hover:underline hover:underline-offset-4 active:translate-y-0 active:text-primary-800 focus-visible:ring-0 focus-visible:underline",
        default:
          "bg-primary-500 text-text-inverse shadow-primary-sm hover:bg-primary-600 active:bg-primary-700",
        outline:
          "border-border bg-surface text-text shadow-xs hover:border-border-strong hover:bg-surface-muted",
        secondary: "bg-surface-muted text-text hover:bg-neutral-200",
        destructive:
          "bg-danger-500 text-text-inverse hover:bg-danger-600 active:bg-danger-700",
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-[0.9375rem]",
        xl: "h-12 gap-2.5 px-6 text-base",
        default: "h-10 px-4",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-11 p-0",
        "icon-xl": "size-12 p-0",
        "icon-xs": "size-6 p-0 [&_svg:not([class*='size-'])]:size-3",
      },
      block: {
        true: "flex w-full items-center justify-center",
        false: null,
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  }
);

function Button({
  className,
  variant = "primary",
  size = "md",
  block = false,
  suppressHydrationWarning = true,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      suppressHydrationWarning={suppressHydrationWarning}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
