import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { LocaleSwitcher } from "@/components/auth/LocaleSwitcher";
import { cn } from "@/lib/utils";

export interface AuthHighlight {
  icon: LucideIcon;
  text: string;
}

type AuthSplitCardProps = {
  title: string;
  subtitle: string;
  brandTitleLine1?: string;
  brandTitleLine2?: string;
  brandSubtitle?: string;
  highlights?: AuthHighlight[];
  children: ReactNode;
  className?: string;
  imageSrc?: string;
  imageAlt?: string;
};

function BrandPanelHeadline({
  line1,
  line2,
  subtitle,
}: {
  line1: string;
  line2?: string;
  subtitle: string;
}): ReactElement {
  return (
    <div className="space-y-5">
      <div>
        <span
          aria-hidden
          className="mb-4 inline-block h-1 w-10 rounded-full bg-primary-500"
        />
        <h2 className="max-w-[32rem] text-pretty text-[1.875rem] font-semibold leading-[1.18] tracking-tight text-white xl:text-[2.625rem]">
          {line1}
          {line2 ? (
            <>
              <br />
              <span className="text-primary-500">{line2}</span>
            </>
          ) : null}
        </h2>
      </div>

      <p className="max-w-[28rem] text-base leading-relaxed text-neutral-400">
        {subtitle}
      </p>
    </div>
  );
}

export function AuthSplitCard({
  title,
  subtitle,
  brandTitleLine1,
  brandTitleLine2,
  brandSubtitle,
  highlights = [],
  children,
  className,
  imageSrc,
  imageAlt = "",
}: AuthSplitCardProps): ReactElement {
  const panelLine1 = brandTitleLine1 ?? title;
  const panelLine2 = brandTitleLine2;
  const panelSubtitle = brandSubtitle ?? subtitle;

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-md",
        "min-h-[32rem] lg:min-h-[38rem]",
        "lg:grid-cols-[1.35fr_1fr]",
        className,
      )}
    >
      <div
        className={cn(
          "relative hidden overflow-hidden bg-ink lg:block",
          "[clip-path:polygon(0_0,100%_0,78%_100%,0_100%)]",
          "rtl:[clip-path:polygon(22%_0,100%_0,100%_100%,0_100%)]",
        )}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : null}

        <div
          className="absolute inset-0 bg-ink"
          style={
            imageSrc
              ? {
                  background:
                    "linear-gradient(160deg, rgb(20 18 17 / 0.65), rgb(20 18 17 / 0.4))",
                }
              : undefined
          }
        />

        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 start-[-15%] size-64 rounded-full bg-primary-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 end-[-10%] size-72 rounded-full bg-primary-700/20 blur-3xl"
        />

        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="relative z-10 flex h-full min-h-[38rem] flex-col justify-between p-10 text-text-inverse xl:p-12">
          <BrandLogo size="xl" variant="onDark" priority />

          <div className="space-y-8 pb-2">
            <BrandPanelHeadline
              line1={panelLine1}
              line2={panelLine2}
              subtitle={panelSubtitle}
            />

            {highlights.length > 0 ? (
              <ul className="space-y-3">
                {highlights.map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-primary-200">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                    <span className="text-sm leading-snug text-neutral-300">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col justify-center bg-surface px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        <div className="absolute top-5 end-5 z-20 sm:top-6 sm:end-6 lg:top-8 lg:end-8 xl:end-10">
          <LocaleSwitcher tone="light" />
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-5 pe-24">
              <BrandLogo size="lg" priority />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {subtitle}
            </p>
          </div>

          <div className="mb-8 hidden lg:block">
            <span
              aria-hidden
              className="mb-4 inline-block h-1 w-10 rounded-full bg-primary-500"
            />
            <h1 className="text-[1.65rem] font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
