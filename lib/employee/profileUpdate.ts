import type { ProfileFormValues } from "@/schemas/employee/profile.schema";
import type { ProfileUpdatePayload } from "@/types/ProfileApiTypes";

export function toProfileUpdatePayload(
  values: ProfileFormValues,
): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = {
    name: values.name.trim(),
    email: values.email.trim(),
  };

  const password = values.password?.trim() ?? "";
  if (password) {
    payload.password = password;
    payload.password_confirmation = values.passwordConfirmation?.trim() ?? "";
  }

  if (values.avatar) {
    payload.image = values.avatar;
  }

  return payload;
}

export function getProfileMutationError(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "error" in error) {
    const value = (error as { error: unknown }).error;
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

export function mapProfileFieldErrors(
  fieldErrors: Record<string, string>,
): Partial<Record<keyof ProfileFormValues, string>> {
  const mapped: Partial<Record<keyof ProfileFormValues, string>> = {};

  for (const [key, message] of Object.entries(fieldErrors)) {
    if (!message.trim()) {
      continue;
    }

    if (key === "password_confirmation") {
      mapped.passwordConfirmation = message;
      continue;
    }

    if (key === "image") {
      mapped.avatar = message;
      continue;
    }

    if (key === "name" || key === "email" || key === "password") {
      mapped[key] = message;
    }
  }

  return mapped;
}
