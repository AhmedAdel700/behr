import type { ProfileFormValues } from "@/schemas/employee/profile.schema";
import { ProfileApiError, type ProfileResult, type ProfileUpdatePayload } from "@/types/ProfileApiTypes";

function readNumericId(value: string | null | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toProfileUpdatePayload(
  values: ProfileFormValues,
  profile: ProfileResult,
): ProfileUpdatePayload {
  const branchId = readNumericId(profile.branchId);
  const departmentId = readNumericId(profile.departmentId);
  const jobPositionId = readNumericId(profile.jobPositionId);
  const role = profile.roles[0]?.trim() || "employee";

  if (branchId === null || departmentId === null || jobPositionId === null) {
    throw new ProfileApiError(
      "Missing work assignment details required to update profile.",
    );
  }

  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    fingerprint_number: values.fingerprintNumber.trim(),
    branch_id: branchId,
    department_id: departmentId,
    job_position_id: jobPositionId,
    role,
  };
}
