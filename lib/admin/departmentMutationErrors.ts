import type { UseFormSetError } from "react-hook-form";
import type { CreateDepartmentFormValues } from "@/schemas/admin/org.schema";

const API_TO_FORM_FIELD: Record<string, keyof CreateDepartmentFormValues> = {
  name: "name",
  branch_id: "branchId",
  manager_user_id: "managerEmployeeId",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMappedFieldErrors(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" && item.trim()) {
      fieldErrors[key] = item;
    }
  }

  return fieldErrors;
}

export function getDepartmentMutationErrorInfo(
  error: unknown,
  fallback: string,
): { message: string; fieldErrors: Record<string, string> } {
  if (!isRecord(error)) {
    if (typeof error === "string" && error.trim()) {
      return { message: error, fieldErrors: {} };
    }

    return { message: fallback, fieldErrors: {} };
  }

  const messageFromErrorProp =
    typeof error.error === "string" && error.error.trim()
      ? error.error
      : null;
  const messageFromMessageProp =
    typeof error.message === "string" && error.message.trim()
      ? error.message
      : null;

  let fieldErrors: Record<string, string> = {};
  if (isRecord(error.data)) {
    fieldErrors = parseMappedFieldErrors(error.data.fieldErrors);
  }

  return {
    message: messageFromErrorProp ?? messageFromMessageProp ?? fallback,
    fieldErrors,
  };
}

export function applyDepartmentMutationErrors(
  error: unknown,
  setError: UseFormSetError<CreateDepartmentFormValues>,
  fallback: string,
): string {
  const { message, fieldErrors } = getDepartmentMutationErrorInfo(
    error,
    fallback,
  );
  const entries = Object.entries(fieldErrors);

  if (entries.length === 0) {
    setError("name", { message });
    return message;
  }

  for (const [apiField, fieldMessage] of entries) {
    const formField = API_TO_FORM_FIELD[apiField] ?? "name";
    setError(formField, { message: fieldMessage });
  }

  return message;
}
