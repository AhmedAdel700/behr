export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  fingerprint_number: number | null;
  image: string | null;
  email_verified_at: string | null;
  branch: string | null;
  department: string | null;
  job_position: string | null;
  roles: string[];
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  user: User;
  token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData | null;
}

export interface RefreshTokenData {
  token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: RefreshTokenData | null;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  data: unknown | null;
}