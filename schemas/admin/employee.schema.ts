import { z } from "zod";
import type {
  CreateEmployeePayload,
  EmployeePayload,
} from "@/types/EmployeesApiTypes";

export type UpdateEmployeeAssignmentFormErrorMessages = {
  nameRequired: string;
  nameMin: string;
  emailRequired: string;
  emailInvalid: string;
  phoneRequired: string;
  phoneInvalid: string;
  branchRequired: string;
  departmentRequired: string;
  positionRequired: string;
  fingerprintRequired: string;
  fingerprintInvalid: string;
};

export function updateEmployeeAssignmentSchema(
  errors: UpdateEmployeeAssignmentFormErrorMessages,
) {
  return z.object({
    name: z
      .string()
      .min(1, { error: errors.nameRequired })
      .min(2, { error: errors.nameMin }),
    email: z
      .string()
      .min(1, { error: errors.emailRequired })
      .pipe(z.email({ error: errors.emailInvalid })),
    phone: z
      .string()
      .min(1, { error: errors.phoneRequired })
      .regex(/^\+?[0-9]{8,15}$/, { error: errors.phoneInvalid }),
    branchId: z.string().min(1, { error: errors.branchRequired }),
    departmentId: z.string().min(1, { error: errors.departmentRequired }),
    jobPositionId: z.string().min(1, { error: errors.positionRequired }),
    fingerprintNumber: z
      .string()
      .min(1, { error: errors.fingerprintRequired })
      .regex(/^[A-Za-z0-9]{1,20}$/, { error: errors.fingerprintInvalid }),
  });
}

export type UpdateEmployeeAssignmentFormValues = z.infer<
  ReturnType<typeof updateEmployeeAssignmentSchema>
>;

export function toEmployeePayload(
  values: UpdateEmployeeAssignmentFormValues,
): EmployeePayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    branch_id: Number(values.branchId),
    department_id: Number(values.departmentId),
    job_position_id: Number(values.jobPositionId),
    fingerprint_number: values.fingerprintNumber.trim(),
  };
}

export type CreateEmployeeFormErrorMessages = {
  nameRequired: string;
  nameMin: string;
  emailRequired: string;
  emailInvalid: string;
  phoneRequired: string;
  phoneInvalid: string;
  fingerprintRequired: string;
  fingerprintInvalid: string;
  branchRequired: string;
  departmentRequired: string;
  positionRequired: string;
  passwordRequired: string;
  passwordMin: string;
  confirmPasswordRequired: string;
  passwordMismatch: string;
  avatarInvalidType: string;
  avatarTooLarge: string;
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function optionalAvatarSchema(errors: CreateEmployeeFormErrorMessages) {
  return z
    .custom<File | undefined>(
      (value) => value === undefined || value instanceof File,
      { message: errors.avatarInvalidType },
    )
    .optional()
    .refine((file) => !file || file.type.startsWith("image/"), {
      message: errors.avatarInvalidType,
    })
    .refine((file) => !file || file.size <= MAX_AVATAR_BYTES, {
      message: errors.avatarTooLarge,
    });
}

export function createEmployeeSchema(
  errors: CreateEmployeeFormErrorMessages,
) {
  return z
    .object({
      name: z
        .string()
        .min(1, { error: errors.nameRequired })
        .min(2, { error: errors.nameMin }),
      email: z
        .string()
        .min(1, { error: errors.emailRequired })
        .pipe(z.email({ error: errors.emailInvalid })),
      phone: z
        .string()
        .min(1, { error: errors.phoneRequired })
        .regex(/^\+?[0-9]{8,15}$/, { error: errors.phoneInvalid }),
      fingerprintNumber: z
        .string()
        .min(1, { error: errors.fingerprintRequired })
        .regex(/^[A-Za-z0-9]{1,20}$/, { error: errors.fingerprintInvalid }),
      branchId: z.string().min(1, { error: errors.branchRequired }),
      departmentId: z.string().min(1, { error: errors.departmentRequired }),
      jobPositionId: z.string().min(1, { error: errors.positionRequired }),
      password: z
        .string()
        .min(1, { error: errors.passwordRequired })
        .min(8, { error: errors.passwordMin }),
      confirmPassword: z
        .string()
        .min(1, { error: errors.confirmPasswordRequired }),
      avatar: optionalAvatarSchema(errors),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      error: errors.passwordMismatch,
    });
}

export type CreateEmployeeFormValues = z.infer<
  ReturnType<typeof createEmployeeSchema>
>;

export function emptyCreateEmployeeFormValues(): CreateEmployeeFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    fingerprintNumber: "",
    branchId: "",
    departmentId: "",
    jobPositionId: "",
    password: "",
    confirmPassword: "",
    avatar: undefined,
  };
}

export function toCreateEmployeePayload(
  values: CreateEmployeeFormValues,
): CreateEmployeePayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    fingerprint_number: values.fingerprintNumber.trim(),
    password: values.password,
    password_confirmation: values.confirmPassword,
    branch_id: Number(values.branchId),
    department_id: Number(values.departmentId),
    job_position_id: Number(values.jobPositionId),
    role: "employee",
    ...(values.avatar ? { image: values.avatar } : {}),
  };
}
