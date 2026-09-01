import type {
  BranchPayload,
  LocalizedApiObject,
  LocalizedTextPayload,
} from "@/types/BranchesApiTypes";

export function emptyLocalizedText(): LocalizedTextPayload {
  return { en: "", ar: "" };
}

export function parseLocalizedField(
  value: unknown,
  lang: string,
): { display: string; localized: LocalizedTextPayload } {
  const fromObject = readLocalizedObject(value);
  if (fromObject) {
    const display =
      lang === "ar"
        ? fromObject.ar || fromObject.en
        : fromObject.en || fromObject.ar;
    return { display, localized: fromObject };
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

function readLocalizedObject(value: unknown): LocalizedTextPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const en = record.en;
  const ar = record.ar;
  const hasEn = typeof en === "string";
  const hasAr = typeof ar === "string";

  if (!hasEn && !hasAr) {
    return null;
  }

  return {
    en: hasEn ? en : "",
    ar: hasAr ? ar : "",
  };
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
