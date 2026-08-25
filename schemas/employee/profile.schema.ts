import { z } from "zod";

export type ProfileErrorMessages = {
  nameRequired: string;
  nameMin: string;
  emailRequired: string;
  emailInvalid: string;
  phoneRequired: string;
  phoneInvalid: string;
  fingerprintRequired: string;
  fingerprintInvalid: string;
  avatarInvalidType: string;
  avatarTooLarge: string;
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function optionalAvatarSchema(errors: ProfileErrorMessages) {
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

export function createProfileSchema(errors: ProfileErrorMessages) {
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
      .regex(/^[0-9]{8,15}$/, { error: errors.phoneInvalid }),
    fingerprintNumber: z
      .string()
      .min(1, { error: errors.fingerprintRequired })
      .regex(/^[A-Za-z0-9]{1,20}$/, { error: errors.fingerprintInvalid }),
    avatar: optionalAvatarSchema(errors),
  });
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;
