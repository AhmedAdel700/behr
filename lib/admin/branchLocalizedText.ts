import type {
  BranchPayload,
  LocalizedTextPayload,
  LocalizedApiValue,
} from "@/types/BranchesApiTypes";

export function emptyLocalizedText(): LocalizedTextPayload {
  return { en: "", ar: "" };
}

export function parseLocalizedField(
  value: LocalizedApiValue | null | undefined,
  lang: string,
): { display: string; localized: LocalizedTextPayload } {
  if (
    typeof value === "object" &&
    value !== null &&
    ("en" in value || "ar" in value)
  ) {
    const localized: LocalizedTextPayload = {
      en: typeof value.en === "string" ? value.en : "",
      ar: typeof value.ar === "string" ? value.ar : "",
    };
    const display =
      lang === "ar"
        ? localized.ar || localized.en
        : localized.en || localized.ar;
    return { display, localized };
  }

  const text = typeof value === "string" ? value : "";
  const localized = emptyLocalizedText();
  if (lang === "ar") {
    localized.ar = text;
  } else {
    localized.en = text;
  }

  return { display: text, localized };
}

export function trimLocalizedText(
  value: LocalizedTextPayload,
): LocalizedTextPayload {
  return {
    en: value.en.trim(),
    ar: value.ar.trim(),
  };
}

export interface BranchLocalizedFormValues {
  name: LocalizedTextPayload;
  city: LocalizedTextPayload;
  address: LocalizedTextPayload;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
}

export function toBranchPayload(values: BranchLocalizedFormValues): BranchPayload {
  const name = trimLocalizedText(values.name);
  const city = trimLocalizedText(values.city);
  const address = trimLocalizedText(values.address);

  return {
    name,
    city,
    address,
    phone: values.phone.trim(),
    email: values.email.trim(),
    latitude: values.latitude,
    longitude: values.longitude,
  };
}

export function localizedTextFromDisplay(
  display: string,
  localized?: LocalizedTextPayload,
): LocalizedTextPayload {
  if (localized) {
    return { ...localized };
  }

  const trimmed = display.trim();
  return { en: trimmed, ar: trimmed };
}
