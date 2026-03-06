import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser, AuthState } from '@/types/auth'

const loadFromStorage = (): Pick<AuthState, 'user' | 'accessToken'> => {
  try {
    const token = localStorage.getItem('access_token')
    const raw = localStorage.getItem('auth_user')
    const user: AuthUser | null = raw ? JSON.parse(raw) : null
    return { user, accessToken: token }
  } catch {
    return { user: null, accessToken: null }
  }
}

interface AuthContextValue extends AuthState {
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage()
  const [user, setUser] = useState<AuthUser | null>(stored.user)
  const [accessToken, setAccessToken] = useState<string | null>(stored.accessToken)

  const login = useCallback((newUser: AuthUser, token: string, refreshToken: string) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    setUser(newUser)
    setAccessToken(token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth_user')
    setUser(null)
    setAccessToken(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}