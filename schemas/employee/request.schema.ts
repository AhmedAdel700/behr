import { z } from "zod";
import type { LeaveTypeUnit } from "@/types/LeaveTypesApiTypes";

export type RequestFormErrorMessages = {
  fromRequired: string;
  toRequired: string;
  rangeInvalid: string;
  startTimeRequired: string;
  endTimeRequired: string;
  timeInvalid: string;
  reasonRequired: string;
  reasonMin: string;
};

export function createRequestSchema(
  unit: LeaveTypeUnit,
  errors: RequestFormErrorMessages,
) {
  const base = z.object({
    from: z.string().min(1, { error: errors.fromRequired }),
    to: z.string().min(1, { error: errors.toRequired }),
    reason: z
      .string()
      .min(1, { error: errors.reasonRequired })
      .min(5, { error: errors.reasonMin }),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  });

  if (unit === "hour") {
    return z
      .object({
        from: z.string().min(1, { error: errors.fromRequired }),
        to: z.string().optional(),
        reason: z
          .string()
          .min(1, { error: errors.reasonRequired })
          .min(5, { error: errors.reasonMin }),
        startTime: z.string().min(1, { error: errors.startTimeRequired }),
        endTime: z.string().min(1, { error: errors.endTimeRequired }),
      })
      .refine((data) => data.endTime > data.startTime, {
        path: ["endTime"],
        error: errors.timeInvalid,
      });
  }

  return base.refine((data) => data.to >= data.from, {
    path: ["to"],
    error: errors.rangeInvalid,
  });
}

export type RequestFormValues = z.infer<ReturnType<typeof createRequestSchema>>;
