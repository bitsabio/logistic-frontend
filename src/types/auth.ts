export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPS_MANAGER'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'BILLING_ADMIN'
  | 'VIEWER'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string
    name: string
    email: string
    roles: UserRole[]
  }
}

export interface AuthUser {
  id: string
  name: string
  email: string
  roles: UserRole[]
}

export interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}