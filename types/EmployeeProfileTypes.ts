export interface EmployeeProfile {
  name: string;
  role: string;
  email: string;
  phone: string;
  fingerprintNumber: string;
  avatarSrc: string;
  department: string;
  branch: string;
  lineManager: string;
  lineManagerRole: string;
  employeeId: string;
  joinDate: string;
}

export type EditableEmployeeProfileFields = Pick<
  EmployeeProfile,
  "name" | "email" | "phone" | "fingerprintNumber" | "avatarSrc"
>;
