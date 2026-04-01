// ─────────────────────────────────────────────────────────────
// Auth Types (Frontend)
// Safe for staff + customer + MFA support
// ─────────────────────────────────────────────────────────────

// ─── User ─────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  name: string | null
  email: string
  roles: string[]

  // Optional future fields (safe to keep)
  status?: 'active' | 'suspended' | 'pending_verification'
  last_login_at?: string | null
  created_at?: string
}

// ─── Auth State (React Context) ───────────────────────────────

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ─── Login Request ────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password?: string

  // MFA support
  mfa_token?: string
  totp_code?: string
}

// ─── Login Response ───────────────────────────────────────────

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: AuthUser

  // MFA step (if required)
  mfa_required?: boolean
  mfa_token?: string
}

// ─── Register Request ─────────────────────────────────────────

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
  company_name?: string
}

// ─── Generic API Error ────────────────────────────────────────

export interface ApiError {
  success?: boolean
  message: string
  code?: string
}

// ─── Refresh Token Response ───────────────────────────────────

export interface RefreshTokenResponse {
  access_token: string
}

// ─── Verify Email Request ─────────────────────────────────────

export interface VerifyEmailRequest {
  email: string
  otp: string
}