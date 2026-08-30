import { z } from "zod";
import {
  emptyLocalizedText,
  trimLocalizedText,
} from "@/lib/admin/branchLocalizedText";
import type { LeaveTypePayload } from "@/types/LeaveTypesApiTypes";

export type LeaveTypeFormErrorMessages = {
  nameEnRequired: string;
  nameEnMin: string;
  nameArRequired: string;
  nameArMin: string;
  descriptionEnRequired: string;
  descriptionArRequired: string;
  unitRequired: string;
  allocationTypeRequired: string;
  allocationAmountRequired: string;
  allocationAmountInvalid: string;
  carryForwardLimitRequired: string;
  carryForwardLimitInvalid: string;
  genderRequired: string;
};

const booleanSelect = z.enum(["true", "false"]);

export function createLeaveTypeSchema(errors: LeaveTypeFormErrorMessages) {
  return z
    .object({
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
      description: z.object({
        en: z.string().min(1, { error: errors.descriptionEnRequired }),
        ar: z.string().min(1, { error: errors.descriptionArRequired }),
      }),
      unit: z.enum(["day", "hour"], { error: errors.unitRequired }),
      allocationType: z.enum(["yearly", "monthly", "none"], {
        error: errors.allocationTypeRequired,
      }),
      allocationAmount: z
        .string()
        .min(1, { error: errors.allocationAmountRequired })
        .refine(
          (value) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed >= 0;
          },
          { error: errors.allocationAmountInvalid },
        ),
      canCarryForward: booleanSelect,
      carryForwardLimit: z.string(),
      isPaid: booleanSelect,
      requiresApproval: booleanSelect,
      genderRestriction: z.enum(["none", "female", "male"], {
        error: errors.genderRequired,
      }),
      isActive: booleanSelect,
    })
    .superRefine((data, ctx) => {
      if (data.canCarryForward !== "true") {
        return;
      }

      if (!data.carryForwardLimit.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["carryForwardLimit"],
          message: errors.carryForwardLimitRequired,
        });
        return;
      }

      const parsed = Number(data.carryForwardLimit);
      if (!Number.isFinite(parsed) || parsed < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["carryForwardLimit"],
          message: errors.carryForwardLimitInvalid,
        });
      }
    });
}

export type LeaveTypeFormValues = z.infer<
  ReturnType<typeof createLeaveTypeSchema>
>;

export function emptyLeaveTypeFormValues(): LeaveTypeFormValues {
  return {
    name: emptyLocalizedText(),
    description: emptyLocalizedText(),
    unit: "day",
    allocationType: "yearly",
    allocationAmount: "1",
    canCarryForward: "false",
    carryForwardLimit: "",
    isPaid: "true",
    requiresApproval: "true",
    genderRestriction: "none",
    isActive: "true",
  };
}

export function toLeaveTypePayload(values: LeaveTypeFormValues): LeaveTypePayload {
  const canCarryForward = values.canCarryForward === "true";

  return {
    name: trimLocalizedText(values.name),
    description: trimLocalizedText(values.description),
    unit: values.unit,
    allocation_type: values.allocationType,
    allocation_amount: Number(values.allocationAmount),
    can_carry_forward: canCarryForward,
    carry_forward_limit: canCarryForward
      ? Number(values.carryForwardLimit)
      : null,
    is_paid: values.isPaid === "true",
    requires_approval: values.requiresApproval === "true",
    gender_restriction: values.genderRestriction,
    is_active: values.isActive === "true",
  };
}
