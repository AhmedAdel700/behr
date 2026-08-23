import { z } from "zod";

export type CreateBranchFormErrorMessages = {
  nameRequired: string;
  nameMin: string;
  cityRequired: string;
  addressRequired: string;
  emailInvalid: string;
  locationRequired: string;
};

export function createBranchSchema(errors: CreateBranchFormErrorMessages) {
  return z.object({
    name: z
      .string()
      .min(1, { error: errors.nameRequired })
      .min(2, { error: errors.nameMin }),
    city: z.string().min(1, { error: errors.cityRequired }),
    address: z.string().min(1, { error: errors.addressRequired }),
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
  nameRequired: string;
  nameMin: string;
  managerRequired: string;
};

export function createDepartmentSchema(
  errors: CreateDepartmentFormErrorMessages
) {
  return z.object({
    branchId: z.string().min(1, { error: errors.branchRequired }),
    name: z
      .string()
      .min(1, { error: errors.nameRequired })
      .min(2, { error: errors.nameMin }),
    managerEmployeeId: z.string().min(1, { error: errors.managerRequired }),
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
