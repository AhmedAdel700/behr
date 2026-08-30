import { z } from "zod";

export type CreateBranchFormErrorMessages = {
  nameEnRequired: string;
  nameEnMin: string;
  nameArRequired: string;
  nameArMin: string;
  cityEnRequired: string;
  cityArRequired: string;
  addressEnRequired: string;
  addressArRequired: string;
  emailInvalid: string;
  locationRequired: string;
};

export function createBranchSchema(errors: CreateBranchFormErrorMessages) {
  return z.object({
    name: z.object({
      en: z
        .string()
        .min(1, { error: errors.nameEnRequired })
        .min(2, { error: errors.nameEnMin }),
      ar: z
        .string()
        .min(1, { error: errors.nameArRequired })
        .min(2, { error: errors.nameArMin }),
    }),
    city: z.object({
      en: z.string().min(1, { error: errors.cityEnRequired }),
      ar: z.string().min(1, { error: errors.cityArRequired }),
    }),
    address: z.object({
      en: z.string().min(1, { error: errors.addressEnRequired }),
      ar: z.string().min(1, { error: errors.addressArRequired }),
    }),
    phone: z.string(),
    email: z.string().refine(
      (value) => {
        const trimmed = value.trim();
        return trimmed === "" || z.email().safeParse(trimmed).success;
      },
      { error: errors.emailInvalid },
    ),
    latitude: z.number({ error: errors.locationRequired }),
    longitude: z.number({ error: errors.locationRequired }),
  });
}

export type CreateBranchFormValues = z.infer<
  ReturnType<typeof createBranchSchema>
>;

export type CreateDepartmentFormErrorMessages = {
  branchRequired: string;
  nameEnRequired: string;
  nameEnMin: string;
  nameArRequired: string;
  nameArMin: string;
  managerRequired: string;
};

export function createDepartmentSchema(
  errors: CreateDepartmentFormErrorMessages
) {
  return z.object({
    branchId: z.string().min(1, { error: errors.branchRequired }),
    name: z.object({
      en: z
        .string()
        .min(1, { error: errors.nameEnRequired })
        .min(2, { error: errors.nameEnMin }),
      ar: z
        .string()
        .min(1, { error: errors.nameArRequired })
        .min(2, { error: errors.nameArMin }),
    }),
    managerEmployeeId: z.string(),
  });
}

export type CreateDepartmentFormValues = z.infer<
  ReturnType<typeof createDepartmentSchema>
>;

export type UpdateDepartmentFormErrorMessages = CreateDepartmentFormErrorMessages;

export function updateDepartmentSchema(
  errors: UpdateDepartmentFormErrorMessages
) {
  return createDepartmentSchema(errors);
}

export type UpdateDepartmentFormValues = CreateDepartmentFormValues;
