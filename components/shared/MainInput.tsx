"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MainButton } from "@/components/shared/MainButton";
import { cn } from "@/lib/utils";

export type MainInputSize = "sm" | "md" | "lg";

type SharedProps = {
  label?: string;
  hint?: string;
  error?: string;
  size?: MainInputSize;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
  required?: boolean;
};

type InputModeProps = SharedProps &
  Omit<React.ComponentProps<"input">, "size"> & {
    as?: "input";
  };

type TextareaModeProps = SharedProps &
  React.ComponentProps<"textarea"> & {
    as: "textarea";
    type?: never;
  };

export type MainInputProps = InputModeProps | TextareaModeProps;

/** All single-line inputs share one height */
const INPUT_HEIGHT = "h-10";

const sizeClasses: Record<
  MainInputSize,
  {
    text: string;
    iconBox: string;
    padStart: string;
    padEnd: string;
    /** Physical padding when input dir is forced LTR (e.g. tel) */
    padIconStart: { ltr: string; rtl: string };
    padIconEnd: { ltr: string; rtl: string };
  }
> = {
  sm: {
    text: "text-xs",
    iconBox: "w-9 [&_svg]:size-3.5",
    padStart: "ps-9",
    padEnd: "pe-9",
    padIconStart: { ltr: "pl-9", rtl: "pr-9" },
    padIconEnd: { ltr: "pr-9", rtl: "pl-9" },
  },
  md: {
    text: "text-sm",
    iconBox: "w-10 [&_svg]:size-4",
    padStart: "ps-10",
    padEnd: "pe-10",
    padIconStart: { ltr: "pl-10", rtl: "pr-10" },
    padIconEnd: { ltr: "pr-10", rtl: "pl-10" },
  },
  lg: {
    text: "text-sm sm:text-base",
    iconBox: "w-11 [&_svg]:size-4",
    padStart: "ps-11",
    padEnd: "pe-11",
    padIconStart: { ltr: "pl-11", rtl: "pr-11" },
    padIconEnd: { ltr: "pr-11", rtl: "pl-11" },
  },
};

export const MainInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  MainInputProps
>(function MainInput(props, ref) {
  const {
    as = "input",
    label,
    hint,
    error,
    size = "md",
    startIcon,
    endIcon,
    containerClassName,
    className,
    id,
    disabled,
    required,
    ...rest
  } = props;

  const t = useTranslations("forms");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [showPassword, setShowPassword] = React.useState(false);

  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const isPassword = as === "input" && "type" in rest && rest.type === "password";
  const isTel = as === "input" && "type" in rest && rest.type === "tel";
  const hasStart = Boolean(startIcon);
  const hasEnd = Boolean(endIcon) || isPassword;
  const sizing = sizeClasses[size];
  const invalid = Boolean(error);

  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const {
    onChange: restOnChange,
    onPaste: restOnPaste,
    ...inputRest
  } = rest as Omit<React.ComponentProps<"input">, "size"> & {
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  };

  const iconDir = isRtl ? "rtl" : "ltr";

  const fieldClassName = cn(
    as === "input" && INPUT_HEIGHT,
    sizing.text,
    // Tel forces dir=ltr for digits; use physical padding so icon spacing matches mail/name
    hasStart &&
      (isTel ? sizing.padIconStart[iconDir] : sizing.padStart),
    hasEnd && (isTel ? sizing.padIconEnd[iconDir] : sizing.padEnd),
    as === "textarea" && "min-h-[9.375rem] h-auto py-2.5",
    className
  );

  const handleTelChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    if (event.target.value !== digitsOnly) {
      event.target.value = digitsOnly;
    }
    restOnChange?.(event);
  };

  const handleTelPaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    const target = event.currentTarget;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const next = `${target.value.slice(0, start)}${pasted}${target.value.slice(end)}`;
    target.value = next.replace(/\D/g, "");
    restOnChange?.({
      ...event,
      target,
      currentTarget: target,
    } as React.ChangeEvent<HTMLInputElement>);
    restOnPaste?.(event);
  };

  return (
    <div
      className={cn("flex w-full min-w-0 flex-col gap-1.5", containerClassName)}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {label ? (
        <label
          htmlFor={fieldId}
          className="ms-1 text-xs font-medium text-text-secondary"
        >
          {label}
          {required ? (
            <span className="ms-0.5 text-danger-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="relative w-full min-w-0">
        {startIcon ? (
          <span
            className={cn(
              "pointer-events-none absolute start-0 top-0 z-10 flex items-center justify-center text-text-muted",
              sizing.iconBox,
              as === "textarea" ? "h-10" : "h-full"
            )}
            aria-hidden="true"
          >
            {startIcon}
          </span>
        ) : null}

        {as === "textarea" ? (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            disabled={disabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={fieldClassName}
            {...(rest as React.ComponentProps<"textarea">)}
          />
        ) : (
          <Input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            disabled={disabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              fieldClassName,
              // Numbers type LTR, but sit on the inline-start side of the field
              isTel && (isRtl ? "text-right" : "text-left")
            )}
            {...inputRest}
            dir={isTel ? "ltr" : undefined}
            inputMode={isTel ? "numeric" : inputRest.inputMode}
            pattern={isTel ? "[0-9]*" : inputRest.pattern}
            onChange={isTel ? handleTelChange : restOnChange}
            onPaste={isTel ? handleTelPaste : restOnPaste}
            type={
              isPassword ? (showPassword ? "text" : "password") : rest.type
            }
          />
        )}

        {isPassword ? (
          <MainButton
            type="button"
            variant="ghost"
            iconOnly
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setShowPassword((value) => !value)}
            className={cn(
              "absolute end-0 top-0 z-10 h-full rounded-none text-text-muted shadow-none hover:bg-transparent hover:text-text",
              sizing.iconBox
            )}
            aria-label={
              showPassword
                ? t.has("hidePassword")
                  ? t("hidePassword")
                  : "Hide password"
                : t.has("showPassword")
                  ? t("showPassword")
                  : "Show password"
            }
            startIcon={showPassword ? <EyeOff /> : <Eye />}
          />
        ) : endIcon ? (
          <span
            className={cn(
              "pointer-events-none absolute end-0 top-0 z-10 flex items-center justify-center text-text-muted",
              sizing.iconBox,
              as === "textarea" ? "h-10" : "h-full"
            )}
            aria-hidden="true"
          >
            {endIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-danger-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

MainInput.displayName = "MainInput";
