import { z } from "zod";

export function createAssignByBranchSchema(errors: {
  branchRequired: string;
}) {
  return z.object({
    branchId: z.string().min(1, { error: errors.branchRequired }),
    departmentId: z.string(),
  });
}

export function createAssignByDepartmentSchema(errors: {
  branchRequired: string;
  departmentRequired: string;
}) {
  return z.object({
    branchId: z.string().min(1, { error: errors.branchRequired }),
    departmentId: z.string().min(1, { error: errors.departmentRequired }),
  });
}

export type AssignLeaveBalancesFormValues = z.infer<
  ReturnType<typeof createAssignByBranchSchema>
>;

export function emptyAssignLeaveBalancesFormValues(): AssignLeaveBalancesFormValues {
  return {
    branchId: "",
    departmentId: "",
  };
}
