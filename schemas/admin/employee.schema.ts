import { z } from "zod";
import type { EmployeePayload } from "@/types/EmployeesApiTypes";

export type UpdateEmployeeAssignmentFormErrorMessages = {
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
    branch_id: Number(values.branchId),
    department_id: Number(values.departmentId),
    job_position_id: Number(values.jobPositionId),
    fingerprint_number: values.fingerprintNumber.trim(),
  };
}
