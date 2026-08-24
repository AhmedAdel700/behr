"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { Camera, UserRound } from "lucide-react";
import { MainButton } from "@/components/shared/MainButton";
import { isRemoteAvatarSrc } from "@/lib/employee/avatar";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export function ProfileAvatar({
  src,
  alt,
  className,
  width = 80,
  height = 80,
}: ProfileAvatarProps): ReactElement {
  if (!src) {
    return (
      <span
        className={cn(
          "inline-grid shrink-0 place-items-center bg-primary-50 text-primary-700",
          className,
        )}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <UserRound className="size-1/2 max-h-10 max-w-10" aria-hidden />
      </span>
    );
  }

  const useNativeImg =
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:");

  if (useNativeImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote API and data URLs
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    );
  }

  if (isRemoteAvatarSrc(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URLs from uploads
    <img src={src} alt={alt} className={className} width={width} height={height} />
  );
}

interface AvatarUploadProps {
  label?: string;
  hint?: string;
  optionalLabel?: string;
  uploadLabel: string;
  changeLabel: string;
  removeLabel: string;
  error?: string;
  optional?: boolean;
  previewSrc?: string;
  value?: File;
  onChange: (file: File | undefined) => void;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function AvatarUpload({
  label,
  hint,
  optionalLabel,
  uploadLabel,
  changeLabel,
  error,
  optional = false,
  previewSrc,
  value,
  onChange,
}: AvatarUploadProps): ReactElement {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value]);

  const displaySrc = objectUrl ?? previewSrc ?? null;
  const actionLabel = displaySrc ? changeLabel : uploadLabel;

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2">
      {label ? (
        <span className="text-center text-sm font-medium text-ink">
          {label}
          {optional && optionalLabel ? (
            <span className="ms-1 text-xs font-normal text-text-muted">
              ({optionalLabel})
            </span>
          ) : null}
        </span>
      ) : null}

      <MainButton
        type="button"
        variant="ghost"
        aria-label={actionLabel}
        onClick={() => {
          inputRef.current?.click();
        }}
        className={cn(
          "group relative size-24 overflow-hidden rounded-2xl p-0 shadow-none ring-2 ring-primary-100",
          "hover:bg-surface-muted hover:ring-primary-200 active:translate-y-0",
          displaySrc ? "bg-surface" : "bg-surface-muted text-text-muted",
        )}
      >
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview
          <img
            src={displaySrc}
            alt=""
            className="absolute inset-0 size-full max-h-none max-w-none object-cover"
          />
        ) : (
          <UserRound className="size-10" aria-hidden />
        )}

        <span
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/0 transition-colors",
            "group-hover:bg-ink/35 group-focus-visible:bg-ink/35",
          )}
        >
          <Camera
            className="size-6 text-text-inverse opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          />
        </span>
      </MainButton>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          onChange(file);
          event.target.value = "";
        }}
      />

      {hint ? (
        <p className="text-center text-xs text-text-muted">{hint}</p>
      ) : null}

      {error ? (
        <p className="text-center text-xs text-danger-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
