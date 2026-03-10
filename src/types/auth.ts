export interface AuthUser {
  id: string
  name: string | null
  email: string
  roles: string[]
}

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginRequest {
  email?: string
  password?: string
  mfa_token?: string
  totp_code?: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: AuthUser
  // MFA step
  mfa_required?: boolean
  mfa_token?: string
}