import { trimLocalizedText } from "@/lib/admin/branchLocalizedText";
import type {
  DepartmentPayload,
  LocalizedTextPayload,
} from "@/types/DepartmentsApiTypes";

export interface DepartmentLocalizedFormValues {
  name: LocalizedTextPayload;
  branchId: string;
  managerEmployeeId: string;
}

export function toDepartmentPayload(
  values: DepartmentLocalizedFormValues,
): DepartmentPayload | null {
  const branchId = Number(values.branchId);
  if (!Number.isFinite(branchId)) {
    return null;
  }

  const managerValue = values.managerEmployeeId.trim();
  const managerUserId =
    managerValue.length > 0 ? Number(managerValue) : null;

  if (managerUserId !== null && !Number.isFinite(managerUserId)) {
    return null;
  }

  return {
    name: trimLocalizedText(values.name),
    branch_id: branchId,
    manager_user_id: managerUserId,
  };
}
