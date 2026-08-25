import { z } from "zod";

export type ProfileErrorMessages = {
  nameRequired: string;
  nameMin: string;
  emailRequired: string;
  emailInvalid: string;
  passwordMin: string;
  confirmPasswordRequired: string;
  passwordMismatch: string;
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
      password: z.string().optional(),
      passwordConfirmation: z.string().optional(),
      avatar: optionalAvatarSchema(errors),
    })
    .superRefine((values, ctx) => {
      const password = values.password?.trim() ?? "";
      const passwordConfirmation = values.passwordConfirmation?.trim() ?? "";

      if (!password && !passwordConfirmation) {
        return;
      }

      if (password.length > 0 && password.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: errors.passwordMin,
        });
      }

      if (password && !passwordConfirmation) {
        ctx.addIssue({
          code: "custom",
          path: ["passwordConfirmation"],
          message: errors.confirmPasswordRequired,
        });
      }

      if (password && passwordConfirmation && password !== passwordConfirmation) {
        ctx.addIssue({
          code: "custom",
          path: ["passwordConfirmation"],
          message: errors.passwordMismatch,
        });
      }
    });
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;
