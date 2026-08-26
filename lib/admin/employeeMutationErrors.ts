import type { UseFormSetError } from "react-hook-form";
import type {
  CreateEmployeeFormValues,
  UpdateEmployeeAssignmentFormValues,
} from "@/schemas/admin/employee.schema";

const CREATE_API_TO_FORM_FIELD: Record<
  string,
  keyof CreateEmployeeFormValues
> = {
  name: "name",
  email: "email",
  phone: "phone",
  fingerprint_number: "fingerprintNumber",
  password: "password",
  password_confirmation: "confirmPassword",
  branch_id: "branchId",
  department_id: "departmentId",
  job_position_id: "jobPositionId",
  image: "avatar",
};

const UPDATE_API_TO_FORM_FIELD: Record<
  string,
  keyof UpdateEmployeeAssignmentFormValues
> = {
  name: "name",
  email: "email",
  phone: "phone",
  fingerprint_number: "fingerprintNumber",
  branch_id: "branchId",
  department_id: "departmentId",
  job_position_id: "jobPositionId",
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

export function getEmployeeMutationErrorInfo(
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

export function applyCreateEmployeeMutationErrors(
  error: unknown,
  setError: UseFormSetError<CreateEmployeeFormValues>,
  fallback: string,
): string {
  const { message, fieldErrors } = getEmployeeMutationErrorInfo(
    error,
    fallback,
  );
  const entries = Object.entries(fieldErrors);

  if (entries.length === 0) {
    return message;
  }

  for (const [apiField, fieldMessage] of entries) {
    const formField = CREATE_API_TO_FORM_FIELD[apiField];
    if (formField) {
      setError(formField, { message: fieldMessage });
    }
  }

  return message;
}

export function applyUpdateEmployeeMutationErrors(
  error: unknown,
  setError: UseFormSetError<UpdateEmployeeAssignmentFormValues>,
  fallback: string,
): string {
  const { message, fieldErrors } = getEmployeeMutationErrorInfo(
    error,
    fallback,
  );
  const entries = Object.entries(fieldErrors);

  if (entries.length === 0) {
    return message;
  }

  for (const [apiField, fieldMessage] of entries) {
    const formField = UPDATE_API_TO_FORM_FIELD[apiField];
    if (formField) {
      setError(formField, { message: fieldMessage });
    }
  }

  return message;
}
