export interface PublicNamedRecord {
  id: string;
  name: string;
}

export interface PublicNamedApiRecord {
  id: number;
  name: string;
}

export interface PublicNamedListApiResponse {
  success: boolean;
  message: string;
  data: PublicNamedApiRecord[] | null;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  fingerprint_number: string;
  branch_id: number;
  department_id: number;
  job_position_id: number;
  image?: File;
}

export interface RegisterResult {
  message: string;
}

export class PublicOrgApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicOrgApiError";
  }
}

export class RegisterApiError extends Error {
  readonly messages: string[];

  constructor(messages: string[]) {
    const normalized = messages.filter((message) => message.trim());
    super(normalized[0] ?? "Registration failed.");
    this.name = "RegisterApiError";
    this.messages = normalized.length > 0 ? normalized : ["Registration failed."];
  }
}
