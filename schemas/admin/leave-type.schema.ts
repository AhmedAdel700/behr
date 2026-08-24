import { z } from "zod";
import type { LeaveTypePayload } from "@/types/LeaveTypesApiTypes";

export type LeaveTypeFormErrorMessages = {
  nameRequired: string;
  nameMin: string;
  descriptionRequired: string;
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
      name: z
        .string()
        .min(1, { error: errors.nameRequired })
        .min(2, { error: errors.nameMin }),
      description: z.string().min(1, { error: errors.descriptionRequired }),
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
    name: "",
    description: "",
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
    name: values.name.trim(),
    description: values.description.trim(),
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
