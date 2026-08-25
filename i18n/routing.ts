import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
    // Don't follow browser Accept-Language / NEXT_LOCALE cookie for `/`.
  // Without this, English browsers on Vercel land on `/en` instead of `/ar`.
  // localeDetection: false,
});
