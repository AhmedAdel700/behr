import { authApiPaths, buildAuthApiUrl } from "@services/auth/shared";
import {
  AuthNetworkError,
  getFetchFailureDetails,
} from "@services/auth/fetchFailure";
import type { RegisterPayload, RegisterResult } from "@/types/PublicOrgApiTypes";
import { RegisterApiError } from "@/types/PublicOrgApiTypes";

function parseRegisterApiMessages(
  payload: unknown,
  fallback: string,
): string[] {
  if (typeof payload !== "object" || payload === null) {
    return [fallback];
  }

  const record = payload as Record<string, unknown>;
  const messages: string[] = [];

  if (
    typeof record.errors === "object" &&
    record.errors !== null &&
    !Array.isArray(record.errors)
  ) {
    const errors = record.errors as Record<string, unknown>;

    for (const value of Object.values(errors)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string" && item.trim()) {
            messages.push(item);
          }
        }
        continue;
      }

      if (typeof value === "string" && value.trim()) {
        messages.push(value);
      }
    }
  }

  if (messages.length > 0) {
    return messages;
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return [record.message];
  }

  return [fallback];
}

function toRegisterFormData(body: RegisterPayload): FormData {
  const formData = new FormData();
  formData.append("full_name", body.full_name);
  formData.append("email", body.email);
  formData.append("phone", body.phone);
  formData.append("password", body.password);
  formData.append("password_confirmation", body.password_confirmation);
  formData.append("fingerprint_number", body.fingerprint_number);
  formData.append("branch_id", String(body.branch_id));
  formData.append("department_id", String(body.department_id));
  formData.append("job_position_id", String(body.job_position_id));

  if (body.image) {
    formData.append("image", body.image);
  }

  return formData;
}

export async function registerWithDetails(
  body: RegisterPayload,
  lang: string,
): Promise<RegisterResult> {
  const url = buildAuthApiUrl(authApiPaths.register);
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        lang,
      },
      body: toRegisterFormData(body),
    });
  } catch (error) {
    const details = getFetchFailureDetails(error, url);
    throw new AuthNetworkError(details);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    typeof payload.success !== "boolean"
  ) {
    throw new RegisterApiError(
      parseRegisterApiMessages(payload, "Registration failed."),
    );
  }

  const responsePayload = payload as { success: boolean; message: string };

  if (!response.ok || !responsePayload.success) {
    throw new RegisterApiError(
      parseRegisterApiMessages(
        payload,
        responsePayload.message || "Registration failed.",
      ),
    );
  }

  return {
    message:
      typeof responsePayload.message === "string" &&
      responsePayload.message.trim()
        ? responsePayload.message
        : "Registration submitted.",
  };
}
